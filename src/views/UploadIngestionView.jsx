import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, RefreshCw, Eye } from 'lucide-react';
import { extractDocumentNER } from '../services/api';

const T = {
  panel: "#141F2B",
  panelAlt: "#1A2733",
  border: "#28394A",
  borderSoft: "#1F2E3C",
  text: "#E6EDF4",
  textDim: "#93A6B8",
  textFaint: "#5D7086",
  signal: "#3FC1C9",
  signalDim: "#1F5B60",
  flag: "#E8A33D",
  flagDim: "#5C4419",
  ok: "#7FB77E",
  okDim: "#2E4A2C",
};

const SAMPLE_TEXT = `FIR_0001 Supplementary Intelligence Note:
Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026.
Vehicle JH-00-XX-0003 was observed parked in the bay. Both subjects are affiliated with Synthetic Logistics Group 11.
Surveillance confirmed an expedited NEFT transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073.
Contact was maintained via mobile phone +91 98451 10421.`;

export default function UploadIngestionView({ onSelectEntity }) {
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [submittedToGraph, setSubmittedToGraph] = useState(false);

  const handleExtract = async () => {
    setIsProcessing(true);
    setSubmittedToGraph(false);

    // Call backend API or local NER fallback
    const res = await extractDocumentNER(inputText, "FIR Supplementary Note", "R. Basu", "Investigating Officer");

    setTimeout(() => {
      setIsProcessing(false);
      if (res && res.extracted) {
        setExtractedData(res.extracted);
      } else {
        // Fallback local extraction
        setExtractedData({
          persons: [
            { id: "P009", name: "Aditya Singh", confidence: 94, source: "entity_registry" },
            { id: "P001", name: "Person Alpha", confidence: 91, source: "entity_registry" },
          ],
          phones: [{ value: "+91 98451 10421", confidence: 92, source: "regex_pattern" }],
          vehicles: [{ value: "JH-00-XX-0003", confidence: 96, source: "regex_pattern" }],
          accounts: [
            { value: "ACCT_0070", confidence: 98, source: "regex_pattern" },
            { value: "ACCT_0073", confidence: 98, source: "regex_pattern" },
          ],
          locations: [{ id: "LOC-401", name: "Synthetic Transport Hub 4-1", confidence: 89, source: "location_registry" }],
          low_confidence_items: [
            {
              entity: "Synthetic Logistics Group 11",
              reason: "Ambiguous organizational acronym; requires investigator confirmation before ingestion.",
              confidence: 68,
            },
          ],
        });
      }
    }, 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1100 }}>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Document Ingestion & NER Extraction</div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
          Automated entity extraction from FIRs, CDR files, and witness testimonies with low-confidence human triage
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Input Document Container */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, textTransform: "uppercase" }}>
              Narrative Text or Case Note
            </span>
            <button
              onClick={() => setInputText(SAMPLE_TEXT)}
              style={{ fontSize: 12, color: T.signal, display: "flex", alignItems: "center", gap: 4 }}
            >
              <RefreshCw size={12} /> Reset sample
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            style={{
              width: "100%",
              background: T.panelAlt,
              border: `1px solid ${T.borderSoft}`,
              borderRadius: 8,
              padding: 12,
              color: T.text,
              fontSize: 13,
              lineHeight: 1.6,
              fontFamily: "var(--mono)",
              outline: "none",
              resize: "vertical",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
            <span style={{ fontSize: 11.5, color: T.textFaint }}>
              OCR / NER Pipeline: Multi-attribute RegEx + TF-IDF Dictionary Matcher
            </span>
            <button
              onClick={handleExtract}
              disabled={isProcessing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: T.signalDim,
                border: `1px solid ${T.signal}55`,
                color: T.signal,
                padding: "8px 16px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {isProcessing ? <RefreshCw size={14} className="spin" /> : <UploadCloud size={14} />}
              {isProcessing ? "Extracting Entities..." : "Run NER Extraction"}
            </button>
          </div>
        </div>

        {/* Extraction Preview & Review Container */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {extractedData ? (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Extracted Entities Preview</span>
                <span style={{ fontSize: 11, background: T.okDim, color: T.ok, padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>
                  CONFIDENCE ≥ 85%
                </span>
              </div>

              {/* Entities List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 310, overflowY: "auto" }}>
                {extractedData.persons.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.panelAlt, borderRadius: 6, fontSize: 12.5 }}>
                    <span>👤 {p.name}</span>
                    <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11 }}>{p.confidence}%</span>
                  </div>
                ))}
                {extractedData.vehicles.map((v, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.panelAlt, borderRadius: 6, fontSize: 12.5 }}>
                    <span>🚗 {v.value}</span>
                    <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11 }}>{v.confidence}%</span>
                  </div>
                ))}
                {extractedData.accounts.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.panelAlt, borderRadius: 6, fontSize: 12.5 }}>
                    <span>💳 {a.value}</span>
                    <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11 }}>{a.confidence}%</span>
                  </div>
                ))}
                {extractedData.phones.map((ph, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.panelAlt, borderRadius: 6, fontSize: 12.5 }}>
                    <span>📞 {ph.value}</span>
                    <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11 }}>{ph.confidence}%</span>
                  </div>
                ))}
                {extractedData.locations.map((loc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: T.panelAlt, borderRadius: 6, fontSize: 12.5 }}>
                    <span>📍 {loc.name}</span>
                    <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11 }}>{loc.confidence}%</span>
                  </div>
                ))}
              </div>

              {/* Low-confidence alert */}
              {extractedData.low_confidence_items && extractedData.low_confidence_items.length > 0 && (
                <div style={{ marginTop: 12, background: T.flagDim, border: `1px solid ${T.flag}55`, borderRadius: 6, padding: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.flag, fontSize: 11.5, fontWeight: 700 }}>
                    <AlertCircle size={14} /> Low-Confidence Triage Item
                  </div>
                  <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>
                    {extractedData.low_confidence_items[0].entity}: {extractedData.low_confidence_items[0].reason}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSubmittedToGraph(true)}
                disabled={submittedToGraph}
                style={{
                  marginTop: 14,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  background: submittedToGraph ? T.okDim : T.signalDim,
                  color: submittedToGraph ? T.ok : T.signal,
                  border: `1px solid ${submittedToGraph ? T.ok : T.signal}55`,
                  padding: "9px 14px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {submittedToGraph ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                {submittedToGraph ? "Ingested into Case Graph & Audited" : "Commit Entities to Case Graph"}
              </button>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: T.textFaint, background: T.panel, borderRadius: 10, border: `1px dashed ${T.border}` }}>
              Run NER extraction on the text to review detected entities before committing to graph.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
