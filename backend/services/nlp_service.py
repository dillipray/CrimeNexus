import re
try:
    import spacy
except (ImportError, Exception):
    spacy = None
from typing import Dict, List, Any, Optional, Set, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.data_loader import loader

# Domain-specific regex patterns for high-precision entity extraction
RE_ACCOUNT = re.compile(r"\bACCT_\d+\b")
RE_VEHICLE = re.compile(r"\b[A-Z]{2}-\d{2}-[A-Z]{2}-\d{4}\b")
RE_PHONE = re.compile(r"(?:\+91[\s\-\.]?\d{4,5}[\s\-\.]?\d{4,5}|\b91[\s\-\.]?\d{4,5}[\s\-\.]?\d{4,5}|\bPHONE_FAKE_\d+\b)")
RE_ORGANIZATION = re.compile(
    r"\b[A-Z][A-Za-z0-9&.]*(?:\s+[A-Z0-9][A-Za-z0-9&.]*)*\s+(?:Logistics Group \d+|Logistics|Syndicate|Cartel|Agency|Pvt Ltd|Private Limited|Gang|Corp|Corporation|Enterprises?|Holdings|Bank)\b"
)
RE_LOCATION_HEURISTIC = re.compile(
    r"\b[A-Z][a-zA-Z0-9]*(?:\s+[A-Z0-9][a-zA-Z0-9\-]*)*\s+(?:Transport Hub \d+-\d+|Transport Hub|Terminal|Airport|Junction|Chowk|Railway Station|Harbor|Port|Depot)\b"
)

# Investigative metadata words to filter out if flagged as entities
ENTITY_STOPWORDS = {
    "fir", "case", "report", "police", "surveillance", "investigation", "note", "bay", "road", "street",
    "the", "this", "that", "these", "those", "both", "subjects", "persons", "account", "vehicle", "phone",
    "neft", "imps", "inr", "rs", "supplementary", "intelligence", "day", "night"
}

# Action verbs mapped to relationship types
ACTION_VERB_MAP = {
    "meet": ("MET_WITH", "met with"),
    "confer": ("MET_WITH", "conferred with"),
    "visit": ("VISITED", "visited"),
    "gather": ("GATHERED_WITH", "gathered with"),
    "assemble": ("ASSEMBLED_WITH", "assembled with"),
    "spot": ("SPOTTED_WITH", "spotted with"),
    "see": ("SEEN_WITH", "seen with"),
    "call": ("COMMUNICATED_WITH", "called"),
    "telephone": ("COMMUNICATED_WITH", "telephoned"),
    "contact": ("COMMUNICATED_WITH", "contacted"),
    "dial": ("COMMUNICATED_WITH", "dialed"),
    "message": ("COMMUNICATED_WITH", "messaged"),
    "speak": ("COMMUNICATED_WITH", "spoke with"),
    "transfer": ("TRANSFERRED_FUNDS_TO", "transferred funds to"),
    "pay": ("TRANSFERRED_FUNDS_TO", "paid funds to"),
    "wire": ("TRANSFERRED_FUNDS_TO", "wired funds to"),
    "send": ("TRANSFERRED_FUNDS_TO", "sent funds to"),
    "remit": ("TRANSFERRED_FUNDS_TO", "remitted funds to"),
    "deposit": ("TRANSFERRED_FUNDS_TO", "deposited funds to"),
    "affiliate": ("AFFILIATED_WITH", "affiliated with"),
    "associate": ("ASSOCIATED_WITH", "associated with"),
    "work": ("WORKS_FOR", "works for"),
    "operate": ("OPERATES_UNDER", "operates under"),
    "drive": ("TRAVELLED_WITH", "drove with"),
    "travel": ("TRAVELLED_WITH", "travelled with"),
    "flee": ("FLED_WITH", "fled with"),
    "transport": ("TRANSPORTED", "transported"),
}


class NLPService:
    def __init__(self, data_loader=loader):
        self.loader = data_loader
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.fir_ids: List[str] = []
        self.fir_texts: List[str] = []
        self.tfidf_matrix = None
        self._init_search_index()

        # Load spaCy NLP pipeline with graceful fallback
        self.nlp = None
        if spacy is not None:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except Exception:
                try:
                    self.nlp = spacy.blank("en")
                except Exception:
                    self.nlp = None

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
        """
        Rule, gazetteer & spaCy-based Named Entity Recognition (NER)
        Extracts persons, phones, vehicles, accounts, locations, organizations, and low-confidence triage items.
        """
        extracted = {
            "persons": [],
            "phones": [],
            "vehicles": [],
            "accounts": [],
            "locations": [],
            "organizations": [],
            "low_confidence_items": [],
        }

        if not text or not text.strip():
            return extracted

        text_lower = text.lower()
        seen_persons: Set[str] = set()
        seen_locations: Set[str] = set()
        seen_orgs: Set[str] = set()

        # 1. Accounts (Regex)
        acct_matches = RE_ACCOUNT.findall(text)
        for acc in sorted(set(acct_matches)):
            extracted["accounts"].append({"value": acc, "confidence": 96, "source": "regex_pattern"})

        # 2. Vehicles (Regex)
        veh_matches = RE_VEHICLE.findall(text)
        for veh in sorted(set(veh_matches)):
            extracted["vehicles"].append({"value": veh, "confidence": 94, "source": "regex_pattern"})

        # 3. Phones (Regex)
        phone_matches = RE_PHONE.findall(text)
        for ph in sorted(set(phone_matches)):
            extracted["phones"].append({"value": ph, "confidence": 92, "source": "regex_pattern"})

        # 4. Known Persons from Entity Registry
        for pid, p in self.loader.persons.items():
            name = p.get("name", "")
            if name and len(name) > 3 and name.lower() in text_lower:
                seen_persons.add(name.lower())
                extracted["persons"].append({
                    "id": pid,
                    "name": name,
                    "confidence": 92,
                    "source": "entity_registry",
                })

        # 5. Known Locations from Registry
        for lid, loc in self.loader.locations.items():
            loc_name = loc.get("name", "")
            if loc_name and len(loc_name) > 4 and loc_name.lower() in text_lower:
                seen_locations.add(loc_name.lower())
                extracted["locations"].append({
                    "id": lid,
                    "name": loc_name,
                    "confidence": 90,
                    "source": "location_registry",
                })

        # 6. Domain-specific Location Heuristics
        for loc_m in RE_LOCATION_HEURISTIC.findall(text):
            loc_clean = loc_m.strip()
            if loc_clean.lower() not in seen_locations and len(loc_clean) > 4:
                seen_locations.add(loc_clean.lower())
                extracted["locations"].append({
                    "id": f"LOC_{abs(hash(loc_clean)) % 10000:04d}",
                    "name": loc_clean,
                    "confidence": 88,
                    "source": "domain_heuristic",
                })

        # 7. Domain-specific Organization Heuristics
        for org_m in RE_ORGANIZATION.findall(text):
            org_clean = org_m.strip()
            if org_clean.lower() not in seen_orgs and len(org_clean) > 3:
                seen_orgs.add(org_clean.lower())
                extracted["organizations"].append({
                    "name": org_clean,
                    "confidence": 92,
                    "source": "domain_heuristic",
                })

        # 8. spaCy Enhanced NER Pipeline
        if self.nlp:
            try:
                doc = self.nlp(text)
                for ent in doc.ents:
                    ent_text = ent.text.strip().replace("\n", " ")
                    ent_lower = ent_text.lower()
                    words = [w.lower() for w in ent_text.split()]

                    # Ignore noise words and domain stop terms
                    if (
                        len(ent_text) < 3
                        or ent_lower in ENTITY_STOPWORDS
                        or any(w in ("note", "intelligence", "report", "fir", "case", "police", "surveillance") for w in words)
                        or RE_ACCOUNT.fullmatch(ent_text)
                        or RE_VEHICLE.fullmatch(ent_text)
                        or RE_PHONE.fullmatch(ent_text)
                    ):
                        continue

                    # PERSON
                    if ent.label_ == "PERSON":
                        if not any(ent_lower in p or p in ent_lower for p in seen_persons):
                            if ent_lower not in seen_locations and ent_lower not in seen_orgs:
                                seen_persons.add(ent_lower)
                                extracted["persons"].append({
                                    "id": f"PER_{abs(hash(ent_text)) % 10000:04d}",
                                    "name": ent_text,
                                    "confidence": 88,
                                    "source": "spacy_ner",
                                })

                    # GPE / LOC / FAC (Locations)
                    elif ent.label_ in ("GPE", "LOC", "FAC"):
                        if not any(ent_lower in l or l in ent_lower for l in seen_locations):
                            if ent_lower not in seen_persons and ent_lower not in seen_orgs:
                                seen_locations.add(ent_lower)
                                extracted["locations"].append({
                                    "id": f"LOC_{abs(hash(ent_text)) % 10000:04d}",
                                    "name": ent_text,
                                    "confidence": 86,
                                    "source": "spacy_ner",
                                })

                    # ORG (Organizations)
                    elif ent.label_ == "ORG":
                        if not any(ent_lower in o or o in ent_lower for o in seen_orgs):
                            if ent_lower not in seen_persons and ent_lower not in seen_locations:
                                seen_orgs.add(ent_lower)
                                extracted["organizations"].append({
                                    "name": ent_text,
                                    "confidence": 86,
                                    "source": "spacy_ner",
                                })
            except Exception:
                pass

        # 9. Low-confidence triage identification
        for p in extracted["persons"]:
            if p.get("confidence", 100) < 80:
                extracted["low_confidence_items"].append({
                    "entity": p["name"],
                    "reason": "Confidence below 80%; requires investigator confirmation",
                    "confidence": p["confidence"],
                })

        for o in extracted["organizations"]:
            if o.get("confidence", 100) < 80:
                extracted["low_confidence_items"].append({
                    "entity": o["name"],
                    "reason": "Ambiguous organization; requires investigator confirmation",
                    "confidence": o["confidence"],
                })

        return extracted

    def extract_relationships(
        self, text: str, entities: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid Action & Relationship Extraction Engine:
        Combines spaCy dependency parsing with pattern-based regex rules for action verbs:
        (meeting, communication, financial transfers, affiliations, vehicle associations).
        """
        if not text or not text.strip():
            return []

        if entities is None:
            entities = self.extract_entities(text)

        known_persons = [p["name"] for p in entities.get("persons", [])]
        known_orgs = [o["name"] for o in entities.get("organizations", [])]
        known_accounts = [a["value"] for a in entities.get("accounts", [])]
        known_locations = [l["name"] for l in entities.get("locations", [])]
        known_vehicles = [v["value"] for v in entities.get("vehicles", [])]
        known_phones = [ph["value"] for ph in entities.get("phones", [])]

        relationships: List[Dict[str, Any]] = []
        seen_rels: Set[Tuple[str, str, str]] = set()

        def add_rel(source: str, src_type: str, action: str, rel_type: str,
                    target: str, tgt_type: str, sentence: str, confidence: int = 90,
                    location: Optional[str] = None):
            src_clean = source.strip()
            tgt_clean = target.strip()
            if not src_clean or not tgt_clean or src_clean.lower() == tgt_clean.lower():
                return
            key = (src_clean.lower(), rel_type.upper(), tgt_clean.lower())
            if key in seen_rels:
                return
            seen_rels.add(key)
            rel = {
                "source": src_clean,
                "source_type": src_type,
                "action": action,
                "relation_type": rel_type,
                "target": tgt_clean,
                "target_type": tgt_type,
                "sentence": sentence.strip().replace("\n", " "),
                "confidence": confidence,
            }
            if location:
                rel["location"] = location.strip()
            relationships.append(rel)

        # Split into sentences
        doc = None
        sents = []
        if self.nlp:
            try:
                doc = self.nlp(text)
                sents = [s.text.strip() for s in doc.sents if s.text.strip()]
            except Exception:
                pass

        if not sents:
            sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

        last_active_persons = list(known_persons[:2])

        for sent in sents:
            sent_clean = sent.replace("\n", " ")

            # ── 1. Financial Transfer Patterns ────────────────────────────────
            # e.g., "transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073"
            re_transfer1 = re.search(
                r"(?:transfer(?:red)?|wired|paid|remitted|sent)(?:\s+of\s+([₹$€£A-Za-z0-9,.]+))?\s+from(?:\s+account)?\s+(ACCT_\d+)\s+to\s+(?:account\s+)?(ACCT_\d+)",
                sent_clean,
                re.IGNORECASE,
            )
            if re_transfer1:
                amt = re_transfer1.group(1) or ""
                src_acct = re_transfer1.group(2)
                tgt_acct = re_transfer1.group(3)
                act_str = f"transferred {amt} to".strip() if amt else "transferred funds to"
                add_rel(
                    source=src_acct,
                    src_type="account",
                    action=act_str,
                    rel_type="TRANSFERRED_FUNDS_TO",
                    target=tgt_acct,
                    tgt_type="account",
                    sentence=sent_clean,
                    confidence=96,
                )

            re_transfer2 = re.search(
                r"(ACCT_\d+)\s+(?:transferred|wired|paid|sent)(?:\s+([₹$€£A-Za-z0-9,.]+))?\s+to\s+(?:account\s+)?(ACCT_\d+)",
                sent_clean,
                re.IGNORECASE,
            )
            if re_transfer2:
                src_acct = re_transfer2.group(1)
                amt = re_transfer2.group(2) or ""
                tgt_acct = re_transfer2.group(3)
                act_str = f"transferred {amt} to".strip() if amt else "transferred funds to"
                add_rel(
                    source=src_acct,
                    src_type="account",
                    action=act_str,
                    rel_type="TRANSFERRED_FUNDS_TO",
                    target=tgt_acct,
                    tgt_type="account",
                    sentence=sent_clean,
                    confidence=96,
                )

            # ── 2. Organizational Affiliation Patterns ─────────────────────────
            # e.g., "Both subjects are affiliated with Synthetic Logistics Group 11"
            re_affil = re.search(
                r"(Both\s+subjects|They|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:are|were|is|was)?\s*(?:affiliated with|members?\s+of|associated with|working for|operates under)\s+([A-Za-z0-9&.\s\-]+?)(?:\.|\,|$)",
                sent_clean,
                re.IGNORECASE,
            )
            if re_affil:
                subj_raw = re_affil.group(1).strip()
                target_org_raw = re_affil.group(2).strip()
                matched_org = None
                for org in known_orgs:
                    if org.lower() in target_org_raw.lower() or target_org_raw.lower() in org.lower():
                        matched_org = org
                        break
                target_org = matched_org or target_org_raw

                if subj_raw.lower() in ("both subjects", "they", "subjects", "both"):
                    target_persons = last_active_persons or known_persons[:2]
                    for p_name in target_persons:
                        add_rel(
                            source=p_name,
                            src_type="person",
                            action="affiliated with",
                            rel_type="AFFILIATED_WITH",
                            target=target_org,
                            tgt_type="organization",
                            sentence=sent_clean,
                            confidence=92,
                        )
                else:
                    add_rel(
                        source=subj_raw,
                        src_type="person",
                        action="affiliated with",
                        rel_type="AFFILIATED_WITH",
                        target=target_org,
                        tgt_type="organization",
                        sentence=sent_clean,
                        confidence=90,
                    )

            # ── 3. Meeting / Interaction Patterns ──────────────────────────────
            # e.g., "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026."
            re_meet = re.search(
                r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:met|conferred with|spotted with|seen with|visited)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s+(?:near|at|in)\s+([^,\.\n]+?))?(?:\s+on|\.|\,|$)",
                sent_clean,
            )
            if re_meet:
                src_person = re_meet.group(1).strip()
                tgt_person = re_meet.group(2).strip()
                loc_cand = re_meet.group(3).strip() if re_meet.group(3) else None

                matched_loc = None
                if loc_cand:
                    for loc in known_locations:
                        if loc.lower() in loc_cand.lower() or loc_cand.lower() in loc.lower():
                            matched_loc = loc
                            break
                    if not matched_loc:
                        matched_loc = loc_cand

                add_rel(
                    source=src_person,
                    src_type="person",
                    action="met",
                    rel_type="MET_WITH",
                    target=tgt_person,
                    tgt_type="person",
                    sentence=sent_clean,
                    confidence=94,
                    location=matched_loc,
                )
                last_active_persons = [src_person, tgt_person]

            # ── 4. Communication Patterns ─────────────────────────────────────
            # e.g., "Contact was maintained via mobile phone +91 98451 10421"
            re_phone_comm = re.search(
                r"(?:contact\s+was\s+maintained\s+via\s+(?:mobile\s+phone\s+)?|called\s+via\s+)(\+?91[\s\-\.]?\d{4,5}[\s\-\.]?\d{4,5}|PHONE_FAKE_\d+)",
                sent_clean,
                re.IGNORECASE,
            )
            if re_phone_comm:
                ph = re_phone_comm.group(1).strip()
                for p_name in (last_active_persons or known_persons[:2]):
                    add_rel(
                        source=p_name,
                        src_type="person",
                        action="contact maintained via",
                        rel_type="COMMUNICATED_VIA",
                        target=ph,
                        tgt_type="phone",
                        sentence=sent_clean,
                        confidence=90,
                    )

            # Direct call: "X called Y"
            re_call = re.search(
                r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:called|telephoned|messaged|spoke with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
                sent_clean,
            )
            if re_call:
                src_call = re_call.group(1).strip()
                tgt_call = re_call.group(2).strip()
                add_rel(
                    source=src_call,
                    src_type="person",
                    action="called",
                    rel_type="COMMUNICATED_WITH",
                    target=tgt_call,
                    tgt_type="person",
                    sentence=sent_clean,
                    confidence=92,
                )

            # ── 5. Vehicle Observations & Association ──────────────────────────
            re_veh_obs = re.search(
                r"Vehicle\s+([A-Z]{2}-\d{2}-[A-Z]{2}-\d{4})\s+was\s+(?:observed|spotted|parked|driven)",
                sent_clean,
                re.IGNORECASE,
            )
            if re_veh_obs:
                veh_plate = re_veh_obs.group(1).strip()
                for p_name in (last_active_persons or known_persons[:1]):
                    add_rel(
                        source=p_name,
                        src_type="person",
                        action="associated with vehicle",
                        rel_type="ASSOCIATED_VEHICLE",
                        target=veh_plate,
                        tgt_type="vehicle",
                        sentence=sent_clean,
                        confidence=88,
                    )

        # ── 6. spaCy Dependency Parsing for Action Verbs ───────────────────────
        if doc and self.nlp:
            try:
                for sent_span in doc.sents:
                    sent_str = sent_span.text.strip().replace("\n", " ")
                    for token in sent_span:
                        if token.pos_ == "VERB":
                            lemma = token.lemma_.lower()
                            if lemma in ACTION_VERB_MAP:
                                rel_type, default_action = ACTION_VERB_MAP[lemma]

                                subjects = [
                                    child for child in token.children
                                    if child.dep_ in ("nsubj", "nsubjpass")
                                ]
                                objects = [
                                    child for child in token.children
                                    if child.dep_ in ("dobj", "attr")
                                ]
                                preps = [
                                    child for child in token.children
                                    if child.dep_ == "prep"
                                ]

                                # Extract location from locative prepositions only
                                loc_found = None
                                for prep in preps:
                                    if prep.text.lower() in ("near", "at", "in"):
                                        pobjs = [c for c in prep.children if c.dep_ == "pobj"]
                                        if pobjs:
                                            subtree_text = " ".join([t.text for t in pobjs[0].subtree])
                                            for known_l in known_locations:
                                                if known_l.lower() in subtree_text.lower():
                                                    loc_found = known_l
                                                    break
                                            if not loc_found:
                                                loc_found = subtree_text

                                # Interactant objects via direct object or connective prepositions
                                for prep in preps:
                                    if prep.text.lower() in ("with", "to", "from", "for"):
                                        objects.extend([
                                            c for c in prep.children
                                            if c.dep_ in ("pobj", "dobj")
                                        ])

                                for subj_tok in subjects:
                                    subj_text = " ".join([t.text for t in subj_tok.subtree]).strip()
                                    matched_subj = None
                                    subj_type = "person"
                                    for p in known_persons:
                                        if p.lower() in subj_text.lower() or subj_text.lower() in p.lower():
                                            matched_subj = p
                                            subj_type = "person"
                                            break
                                    if not matched_subj:
                                        for a in known_accounts:
                                            if a in subj_text:
                                                matched_subj = a
                                                subj_type = "account"
                                                break
                                    if not matched_subj and len(subj_text) > 3 and subj_tok.pos_ == "PROPN":
                                        matched_subj = subj_text

                                    for obj_tok in objects:
                                        obj_text = " ".join([t.text for t in obj_tok.subtree]).strip()
                                        matched_obj = None
                                        obj_type = "person"
                                        for p in known_persons:
                                            if p.lower() in obj_text.lower() or obj_text.lower() in p.lower():
                                                matched_obj = p
                                                obj_type = "person"
                                                break
                                        if not matched_obj:
                                            for o in known_orgs:
                                                if o.lower() in obj_text.lower() or obj_text.lower() in o.lower():
                                                    matched_obj = o
                                                    obj_type = "organization"
                                                    break
                                        if not matched_obj:
                                            for a in known_accounts:
                                                if a in obj_text:
                                                    matched_obj = a
                                                    obj_type = "account"
                                                    break
                                        if not matched_obj and len(obj_text) > 3 and obj_tok.pos_ == "PROPN":
                                            matched_obj = obj_text

                                        if matched_subj and matched_obj and matched_subj.lower() != matched_obj.lower():
                                            add_rel(
                                                source=matched_subj,
                                                src_type=subj_type,
                                                action=default_action,
                                                rel_type=rel_type,
                                                target=matched_obj,
                                                tgt_type=obj_type,
                                                sentence=sent_str,
                                                confidence=90,
                                                location=loc_found,
                                            )
            except Exception:
                pass

        return relationships

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
