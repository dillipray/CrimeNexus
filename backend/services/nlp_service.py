import re
from typing import Dict, List, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.data_loader import loader

class NLPService:
    def __init__(self, data_loader=loader):
        self.loader = data_loader
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.fir_ids: List[str] = []
        self.fir_texts: List[str] = []
        self.tfidf_matrix = None
        self._init_search_index()

    def _init_search_index(self):
        self.fir_ids = []
        self.fir_texts = []
        for cid, fir in self.loader.fir_reports.items():
            text = fir.get("text", "")
            if text:
                self.fir_ids.append(cid)
                self.fir_texts.append(text)

        if self.fir_texts:
            self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
            self.tfidf_matrix = self.vectorizer.fit_transform(self.fir_texts)

    def extract_entities(self, text: str) -> Dict[str, Any]:
        """Rule & dictionary-based NER with confidence calculation"""
        extracted = {
            "persons": [],
            "phones": [],
            "vehicles": [],
            "accounts": [],
            "locations": [],
            "low_confidence_items": [],
        }

        # 1. Accounts
        acct_matches = re.findall(r"\bACCT_\d+\b", text)
        for acc in set(acct_matches):
            extracted["accounts"].append({"value": acc, "confidence": 96, "source": "regex_pattern"})

        # 2. Vehicles
        veh_matches = re.findall(r"\b[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}\b", text)
        for veh in set(veh_matches):
            extracted["vehicles"].append({"value": veh, "confidence": 94, "source": "regex_pattern"})

        # 3. Phones
        phone_matches = re.findall(r"\b(?:PHONE_FAKE_\d+|\+?91[\s\-\.]?\d{4,5}[\s\-\.]?\d{4,5})\b", text)
        for ph in set(phone_matches):
            extracted["phones"].append({"value": ph, "confidence": 92, "source": "regex_pattern"})

        # 4. Dictionary matching for known Persons
        text_lower = text.lower()
        for pid, p in self.loader.persons.items():
            name = p.get("name", "")
            if name and len(name) > 3 and name.lower() in text_lower:
                extracted["persons"].append({
                    "id": pid,
                    "name": name,
                    "confidence": 90,
                    "source": "entity_registry",
                })

        # 5. Dictionary matching for Locations
        for lid, loc in self.loader.locations.items():
            loc_name = loc.get("name", "")
            if loc_name and len(loc_name) > 4 and loc_name.lower() in text_lower:
                extracted["locations"].append({
                    "id": lid,
                    "name": loc_name,
                    "confidence": 88,
                    "source": "location_registry",
                })

        # Identify any low-confidence ambiguities
        for p in extracted["persons"]:
            if p["confidence"] < 80:
                extracted["low_confidence_items"].append({
                    "entity": p["name"],
                    "reason": "Confidence below threshold; requires investigator confirmation",
                    "confidence": p["confidence"],
                })

        return extracted

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Vector similarity search over FIR narratives"""
        if not self.vectorizer or self.tfidf_matrix is None or not query.strip():
            return []

        try:
            q_vec = self.vectorizer.transform([query])
            sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
            
            ranked_indices = sims.argsort()[::-1][:top_k]
            results = []
            for idx in ranked_indices:
                score = float(sims[idx])
                if score > 0.05:
                    cid = self.fir_ids[idx]
                    fir = self.loader.fir_reports.get(cid, {})
                    case_meta = self.loader.cases.get(cid, {})
                    results.append({
                        "case_id": cid,
                        "score": round(score, 3),
                        "confidence": int(score * 100),
                        "text": fir.get("text", ""),
                        "district": case_meta.get("district", "Unknown"),
                        "state": case_meta.get("state", "Unknown"),
                        "crime_type": case_meta.get("crime_type", "General"),
                    })
            return results
        except Exception:
            return []

nlp_service = NLPService()
