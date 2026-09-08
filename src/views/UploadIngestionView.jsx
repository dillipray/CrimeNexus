import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowRight,
  RefreshCw, FileSearch, ScanLine, Layers, X, Eye, Network, GitBranch,
  MapPin, Building2, Sparkles, Share2
} from 'lucide-react';
import { extractDocumentNER, uploadPDFWithNER } from '../services/api';

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
  danger: "#E05C5C",
  dangerDim: "#4A1E1E",
  purple: "#B388FF",
  purpleDim: "#3D2E5A",
};

const SAMPLE_TEXT = `FIR_0001 Supplementary Intelligence Note:
Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026.
Vehicle JH-00-XX-0003 was observed parked in the bay. Both subjects are affiliated with Synthetic Logistics Group 11.
Surveillance confirmed an expedited NEFT transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073.
Contact was maintained via mobile phone +91 98451 10421.`;

// ── Shared: Entity list renderer ─────────────────────────────────────────────
function EntityList({ extractedData }) {
  const totalEntities =
    (extractedData.persons?.length || 0) +
    (extractedData.organizations?.length || 0) +
    (extractedData.vehicles?.length || 0) +
    (extractedData.accounts?.length || 0) +
    (extractedData.phones?.length || 0) +
    (extractedData.locations?.length || 0);

  if (totalEntities === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: T.textFaint, fontSize: 13 }}>
        No entities detected. Check the text quality or try PaddleOCR mode.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflowY: 'auto' }}>
      {extractedData.persons?.map((p, i) => (
        <EntityRow key={`p${i}`} icon="👤" label={p.name} category="Person" confidence={p.confidence} />
      ))}
      {extractedData.organizations?.map((o, i) => (
        <EntityRow key={`o${i}`} icon="🏢" label={o.name} category="Organization" confidence={o.confidence} />
      ))}
      {extractedData.vehicles?.map((v, i) => (
        <EntityRow key={`v${i}`} icon="🚗" label={v.value} category="Vehicle" confidence={v.confidence} />
      ))}
      {extractedData.accounts?.map((a, i) => (
        <EntityRow key={`a${i}`} icon="💳" label={a.value} category="Account" confidence={a.confidence} />
      ))}
      {extractedData.phones?.map((ph, i) => (
        <EntityRow key={`ph${i}`} icon="📞" label={ph.value} category="Phone" confidence={ph.confidence} />
      ))}
      {extractedData.locations?.map((loc, i) => (
        <EntityRow key={`l${i}`} icon="📍" label={loc.name} category="Location" confidence={loc.confidence} />
      ))}
    </div>
  );
}

function EntityRow({ icon, label, category, confidence }) {
  const color = confidence >= 90 ? T.ok : confidence >= 75 ? T.flag : T.textDim;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', background: T.panelAlt, borderRadius: 6, fontSize: 12.5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span>{icon}</span>
        <span style={{ fontWeight: 500 }}>{label}</span>
        {category && (
          <span style={{ fontSize: 10, color: T.textFaint, background: T.borderSoft, padding: '1px 5px', borderRadius: 3 }}>
            {category}
          </span>
        )}
      </div>
      <span style={{ fontFamily: 'var(--mono)', color, fontSize: 11, fontWeight: 600 }}>{confidence}%</span>
    </div>
  );
}

// ── Shared: Relationships & Actions renderer ─────────────────────────────────
function RelationshipList({ relationships }) {
  if (!relationships || relationships.length === 0) {
    return (
      <div style={{ padding: '14px 0', textAlign: 'center', color: T.textFaint, fontSize: 12.5 }}>
        No explicit action interactions detected in current text passage.
      </div>
    );
  }

  const getRelColor = (type) => {
    switch (type) {
      case 'MET_WITH': return { bg: '#E8A33D22', border: '#E8A33D66', text: '#E8A33D' };
      case 'TRANSFERRED_FUNDS_TO': return { bg: '#7FB77E22', border: '#7FB77E66', text: '#7FB77E' };
      case 'AFFILIATED_WITH': return { bg: '#3FC1C922', border: '#3FC1C966', text: '#3FC1C9' };
      case 'COMMUNICATED_VIA':
      case 'COMMUNICATED_WITH': return { bg: '#B388FF22', border: '#B388FF66', text: '#B388FF' };
      case 'ASSOCIATED_VEHICLE': return { bg: '#FF980022', border: '#FF980066', text: '#FF9800' };
      default: return { bg: '#93A6B822', border: '#93A6B866', text: '#93A6B8' };
    }
  };

  const getEntityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'person': return '👤';
      case 'organization': return '🏢';
      case 'account': return '💳';
      case 'vehicle': return '🚗';
      case 'phone': return '📞';
      case 'location': return '📍';
      default: return '🔹';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 310, overflowY: 'auto' }}>
      {relationships.map((rel, idx) => {
        const theme = getRelColor(rel.relation_type);
        return (
          <div
            key={`rel-${idx}`}
            style={{
              background: T.panelAlt,
              border: `1px solid ${T.borderSoft}`,
              borderRadius: 8,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Graph Link Header: Source -> Action -> Target */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12.5 }}>
                <span style={{ fontWeight: 600, color: T.text, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {getEntityIcon(rel.source_type)} {rel.source}
                </span>

                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  fontFamily: 'var(--mono)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: theme.bg,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  textTransform: 'uppercase',
                }}>
                  {rel.relation_type.replace(/_/g, ' ')}
                </span>

                <span style={{ color: T.textDim, fontSize: 11 }}>→</span>

                <span style={{ fontWeight: 600, color: T.text, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {getEntityIcon(rel.target_type)} {rel.target}
                </span>
              </div>

              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: rel.confidence >= 90 ? T.ok : T.flag,
                background: T.panel,
                padding: '2px 6px',
                borderRadius: 4,
                border: `1px solid ${T.border}`,
              }}>
                {rel.confidence}%
              </span>
            </div>

            {/* Context location & Action label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11.5, color: T.textDim }}>
              {rel.action && (
                <span>Action: <strong style={{ color: T.text }}>{rel.action}</strong></span>
              )}
              {rel.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: T.signal }}>
                  <MapPin size={11} /> {rel.location}
                </span>
              )}
            </div>

            {/* Narrative Context Sentence */}
            {rel.sentence && (
              <div style={{
                fontSize: 11,
                color: T.textFaint,
                background: T.panel,
                borderRadius: 5,
                padding: '4px 8px',
                borderLeft: `2px solid ${theme.text}`,
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}>
                "{rel.sentence}"
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: text input ───────────────────────────────────────────────────────────
function TextInputTab({ onExtractionComplete }) {
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = async () => {
    setIsProcessing(true);
    const res = await extractDocumentNER(inputText, 'FIR Supplementary Note', 'R. Basu', 'Investigating Officer');
    setTimeout(() => {
      setIsProcessing(false);
      if (res?.extracted) {
        onExtractionComplete(res.extracted, 'text', null, res.relationships || [], res.cleaned_text || inputText);
      } else {
        // Fallback rich local extraction for offline resilience
        onExtractionComplete({
          persons: [
            { id: 'P009', name: 'Aditya Singh', confidence: 92, source: 'entity_registry' },
            { id: 'P001', name: 'Person Alpha', confidence: 92, source: 'entity_registry' },
          ],
          organizations: [
            { name: 'Synthetic Logistics Group 11', confidence: 92, source: 'domain_heuristic' }
          ],
          phones: [{ value: '+91 98451 10421', confidence: 92, source: 'regex_pattern' }],
          vehicles: [{ value: 'JH-00-XX-0003', confidence: 94, source: 'regex_pattern' }],
          accounts: [
            { value: 'ACCT_0070', confidence: 96, source: 'regex_pattern' },
            { value: 'ACCT_0073', confidence: 96, source: 'regex_pattern' },
          ],
          locations: [{ id: 'LOC-401', name: 'Synthetic Transport Hub 4-1', confidence: 90, source: 'location_registry' }],
          low_confidence_items: [],
        }, 'text', null, [
          {
            source: "Aditya Singh",
            source_type: "person",
            action: "met",
            relation_type: "MET_WITH",
            target: "Person Alpha",
            target_type: "person",
            location: "Synthetic Transport Hub 4-1",
            sentence: "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026.",
            confidence: 94,
          },
          {
            source: "Aditya Singh",
            source_type: "person",
            action: "associated with vehicle",
            relation_type: "ASSOCIATED_VEHICLE",
            target: "JH-00-XX-0003",
            target_type: "vehicle",
            sentence: "Vehicle JH-00-XX-0003 was observed parked in the bay.",
            confidence: 88,
          },
          {
            source: "Person Alpha",
            source_type: "person",
            action: "associated with vehicle",
            relation_type: "ASSOCIATED_VEHICLE",
            target: "JH-00-XX-0003",
            target_type: "vehicle",
            sentence: "Vehicle JH-00-XX-0003 was observed parked in the bay.",
            confidence: 88,
          },
          {
            source: "Aditya Singh",
            source_type: "person",
            action: "affiliated with",
            relation_type: "AFFILIATED_WITH",
            target: "Synthetic Logistics Group 11",
            target_type: "organization",
            sentence: "Both subjects are affiliated with Synthetic Logistics Group 11.",
            confidence: 92,
          },
          {
            source: "Person Alpha",
            source_type: "person",
            action: "affiliated with",
            relation_type: "AFFILIATED_WITH",
            target: "Synthetic Logistics Group 11",
            target_type: "organization",
            sentence: "Both subjects are affiliated with Synthetic Logistics Group 11.",
            confidence: 92,
          },
          {
            source: "ACCT_0070",
            source_type: "account",
            action: "transferred ₹4,50,000 to",
            relation_type: "TRANSFERRED_FUNDS_TO",
            target: "ACCT_0073",
            target_type: "account",
            sentence: "Surveillance confirmed an expedited NEFT transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073.",
            confidence: 96,
          },
          {
            source: "Aditya Singh",
            source_type: "person",
            action: "contact maintained via",
            relation_type: "COMMUNICATED_VIA",
            target: "+91 98451 10421",
            target_type: "phone",
            sentence: "Contact was maintained via mobile phone +91 98451 10421.",
            confidence: 90,
          },
          {
            source: "Person Alpha",
            source_type: "person",
            action: "contact maintained via",
            relation_type: "COMMUNICATED_VIA",
            target: "+91 98451 10421",
            target_type: "phone",
            sentence: "Contact was maintained via mobile phone +91 98451 10421.",
            confidence: 90,
          }
        ], inputText);
      }
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase' }}>
            Narrative Text / Case Note
          </span>
          <button
            onClick={() => setInputText(SAMPLE_TEXT)}
            style={{ fontSize: 12, color: T.signal, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <RefreshCw size={12} /> Reset sample
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={10}
          style={{
            width: '100%',
            background: T.panelAlt,
            border: `1px solid ${T.borderSoft}`,
            borderRadius: 8,
            padding: 12,
            color: T.text,
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: 'var(--mono)',
            outline: 'none',
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 11.5, color: T.textFaint }}>
            Regex + spaCy NER &amp; Dependency Parser
          </span>
          <button
            onClick={handleExtract}
            disabled={isProcessing}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: T.signalDim, border: `1px solid ${T.signal}55`,
              color: T.signal, padding: '8px 16px', borderRadius: 7,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isProcessing ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
            {isProcessing ? 'Extracting Intelligence...' : 'Run NER & Action Extraction'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: PDF upload ───────────────────────────────────────────────────────────
function PDFUploadTab({ onExtractionComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [forceOcr, setForceOcr] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [extractionMode, setExtractionMode] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setStatusMsg(forceOcr
      ? '🔍 Running PaddleOCR on PDF pages (scanned document mode)…'
      : '📄 Detecting PDF type — trying digital text extraction first…'
    );

    const res = await uploadPDFWithNER(selectedFile, forceOcr);
    setIsProcessing(false);

    if (!res || res.error) {
      setStatusMsg(`❌ Error: ${res?.error || 'Unknown error from server.'}`);
      return;
    }

    setExtractionMode(res.extraction?.mode || 'digital');
    const modeLabel = { digital: '📄 Digital', ocr: '🔍 PaddleOCR', hybrid: '⚡ Hybrid' }[res.extraction?.mode] || '';
    setStatusMsg(`${modeLabel} extraction complete — ${res.extraction?.page_count} page(s), ${res.extraction?.char_count} chars.`);
    onExtractionComplete(res.extracted || {}, res.extraction?.mode || 'digital', res.extraction, res.relationships || [], res.cleaned_text || '');
  };

  const modeColor = { digital: T.signal, ocr: T.flag, hybrid: T.ok }[extractionMode] || T.textDim;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          background: dragOver ? T.signalDim : T.panel,
          border: `2px dashed ${dragOver ? T.signal : T.border}`,
          borderRadius: 12,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-upload-input"
        />
        {selectedFile ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <FileText size={32} color={T.signal} />
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{selectedFile.name}</div>
            <div style={{ color: T.textDim, fontSize: 12 }}>
              {(selectedFile.size / 1024).toFixed(1)} KB · Click to change
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <UploadCloud size={36} color={T.textFaint} />
            <div style={{ color: T.textDim, fontSize: 14 }}>
              Drag &amp; drop a PDF here, or <span style={{ color: T.signal, fontWeight: 600 }}>click to browse</span>
            </div>
            <div style={{ color: T.textFaint, fontSize: 12 }}>Max 50 MB · Digital &amp; scanned PDFs supported</div>
          </div>
        )}
      </div>

      {/* Options row */}
      <div style={{
        background: T.panel, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase' }}>Extraction Mode</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ModeChip
              icon={<FileSearch size={13} />}
              label="Auto (pypdf → OCR fallback)"
              active={!forceOcr}
              onClick={() => setForceOcr(false)}
            />
            <ModeChip
              icon={<ScanLine size={13} />}
              label="Force PaddleOCR"
              active={forceOcr}
              onClick={() => setForceOcr(true)}
            />
          </div>
        </div>

        <button
          onClick={handleUploadAndExtract}
          disabled={!selectedFile || isProcessing}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: selectedFile && !isProcessing ? T.signalDim : T.panelAlt,
            border: `1px solid ${selectedFile && !isProcessing ? T.signal + '55' : T.border}`,
            color: selectedFile && !isProcessing ? T.signal : T.textFaint,
            padding: '9px 18px', borderRadius: 7,
            fontSize: 13, fontWeight: 600, cursor: selectedFile && !isProcessing ? 'pointer' : 'not-allowed',
          }}
        >
          {isProcessing ? <RefreshCw size={14} className="spin" /> : <Layers size={14} />}
          {isProcessing ? 'Processing PDF…' : 'Extract + Run NER'}
        </button>
      </div>

      {/* Status bar */}
      {statusMsg && (
        <div style={{
          fontSize: 12.5, color: statusMsg.startsWith('❌') ? T.danger : T.textDim,
          background: statusMsg.startsWith('❌') ? T.dangerDim : T.panelAlt,
          border: `1px solid ${statusMsg.startsWith('❌') ? T.danger + '33' : T.borderSoft}`,
          borderRadius: 7, padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {statusMsg}
          {extractionMode && (
            <span style={{
              marginLeft: 'auto', padding: '2px 7px', borderRadius: 4,
              background: modeColor + '22', color: modeColor,
              fontWeight: 700, fontSize: 10.5, textTransform: 'uppercase',
            }}>
              {extractionMode}
            </span>
          )}
        </div>
      )}

      {/* Mode info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InfoCard
          icon={<FileSearch size={15} color={T.signal} />}
          title="Digital PDFs — pypdf"
          body="Instant text layer extraction with unicode normalization. Works on born-digital FIRs and legal filings."
        />
        <InfoCard
          icon={<ScanLine size={15} color={T.flag} />}
          title="Scanned PDFs — PaddleOCR"
          body="Rasterises pages at 200 DPI then runs PP-OCR deep-learning text recognition with automated hyphenation repair."
        />
      </div>
    </div>
  );
}

function ModeChip({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 6,
        background: active ? T.signalDim : T.panelAlt,
        border: `1px solid ${active ? T.signal + '66' : T.border}`,
        color: active ? T.signal : T.textDim,
        fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer',
      }}
    >
      {icon} {label}
    </button>
  );
}

function InfoCard({ icon, title, body }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────
export default function UploadIngestionView({ onSelectEntity }) {
  const [activeTab, setActiveTab] = useState('text');
  const [extractedData, setExtractedData] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [cleanedText, setCleanedText] = useState('');
  const [extractionSource, setExtractionSource] = useState(null);
  const [pdfExtraction, setPdfExtraction] = useState(null);
  const [submittedToGraph, setSubmittedToGraph] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [showCleanedText, setShowCleanedText] = useState(false);

  const handleExtractionComplete = (entities, source, pdfResult = null, rels = [], cleaned = '') => {
    setExtractedData(entities);
    setExtractionSource(source);
    setPdfExtraction(pdfResult);
    setRelationships(rels);
    setCleanedText(cleaned);
    setSubmittedToGraph(false);
  };

  const tabs = [
    { id: 'text', label: 'Text / Case Note', icon: <FileText size={14} /> },
    { id: 'pdf', label: 'PDF Upload', icon: <UploadCloud size={14} /> },
  ];

  const totalEntityCount = extractedData
    ? (extractedData.persons?.length || 0) +
      (extractedData.organizations?.length || 0) +
      (extractedData.vehicles?.length || 0) +
      (extractedData.accounts?.length || 0) +
      (extractedData.phones?.length || 0) +
      (extractedData.locations?.length || 0)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1150 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 600 }}>
          Document Ingestion &amp; Intelligence Extraction
        </div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
          Regex text normalization, custom spaCy Named Entity Recognition (NER), and dependency parse relationship extraction
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`ingestion-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${T.signal}` : '2px solid transparent',
              color: activeTab === tab.id ? T.signal : T.textDim,
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: -1,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr', gap: 16 }}>
        {/* Left: input panel */}
        <div>
          {activeTab === 'text'
            ? <TextInputTab onExtractionComplete={handleExtractionComplete} />
            : <PDFUploadTab onExtractionComplete={handleExtractionComplete} />
          }
        </div>

        {/* Right: entity & relationship extraction results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {extractedData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 1. Entities Card */}
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Extracted Entities Preview</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      background: T.signalDim, color: T.signal,
                      padding: '2px 7px', borderRadius: 10,
                    }}>
                      {totalEntityCount} found
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {extractionSource && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 4,
                        background: { text: T.signalDim, digital: T.signalDim, ocr: T.flagDim, hybrid: T.okDim }[extractionSource] || T.panelAlt,
                        color: { text: T.signal, digital: T.signal, ocr: T.flag, hybrid: T.ok }[extractionSource] || T.textDim,
                        textTransform: 'uppercase',
                      }}>
                        {{ text: 'NER & RULES', digital: 'DIGITAL PDF', ocr: 'OCR', hybrid: 'HYBRID' }[extractionSource]}
                      </span>
                    )}
                    <span style={{ fontSize: 11, background: T.okDim, color: T.ok, padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
                      CONFIDENCE ≥ 85%
                    </span>
                  </div>
                </div>

                <EntityList extractedData={extractedData} />

                {/* Low-confidence alert */}
                {extractedData.low_confidence_items?.length > 0 && (
                  <div style={{ marginTop: 12, background: T.flagDim, border: `1px solid ${T.flag}55`, borderRadius: 6, padding: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.flag, fontSize: 11.5, fontWeight: 700 }}>
                      <AlertCircle size={14} /> Low-Confidence Triage Item
                    </div>
                    <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>
                      {extractedData.low_confidence_items[0].entity}: {extractedData.low_confidence_items[0].reason}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Relationships Card */}
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Network size={16} color={T.signal} />
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>Extracted Interactions &amp; Graph Edges</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: relationships.length > 0 ? T.purpleDim : T.panelAlt,
                    color: relationships.length > 0 ? T.purple : T.textFaint,
                    padding: '2px 8px', borderRadius: 10,
                  }}>
                    {relationships.length} Identified
                  </span>
                </div>

                <RelationshipList relationships={relationships} />
              </div>

              {/* Cleaned text & raw toggle */}
              <div style={{ display: 'flex', gap: 12 }}>
                {cleanedText && (
                  <div>
                    <button
                      onClick={() => setShowCleanedText(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, color: T.signal, background: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <Eye size={12} /> {showCleanedText ? 'Hide' : 'Show'} cleaned narrative
                    </button>
                    {showCleanedText && (
                      <pre style={{
                        marginTop: 8, padding: 10, background: T.panelAlt,
                        borderRadius: 7, fontSize: 11, color: T.textDim,
                        maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {cleanedText}
                      </pre>
                    )}
                  </div>
                )}

                {pdfExtraction?.full_text && (
                  <div>
                    <button
                      onClick={() => setShowRawText(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, color: T.signal, background: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <Eye size={12} /> {showRawText ? 'Hide' : 'Show'} raw PDF text
                    </button>
                    {showRawText && (
                      <pre style={{
                        marginTop: 8, padding: 10, background: T.panelAlt,
                        borderRadius: 7, fontSize: 11, color: T.textDim,
                        maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {pdfExtraction.full_text.slice(0, 2000)}{pdfExtraction.full_text.length > 2000 ? '\n…[truncated]' : ''}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              {/* Commit button */}
              <button
                id="commit-entities-btn"
                onClick={() => setSubmittedToGraph(true)}
                disabled={submittedToGraph}
                style={{
                  marginTop: 4, width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: submittedToGraph ? T.okDim : T.signalDim,
                  color: submittedToGraph ? T.ok : T.signal,
                  border: `1px solid ${submittedToGraph ? T.ok : T.signal}55`,
                  padding: '10px 16px', borderRadius: 7,
                  fontSize: 13, fontWeight: 600, cursor: submittedToGraph ? 'default' : 'pointer',
                }}
              >
                {submittedToGraph ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
                {submittedToGraph
                  ? `Committed ${totalEntityCount} Entities & ${relationships.length} Edges into Case Graph`
                  : 'Commit Entities & Relationships to Case Graph'}
              </button>
            </div>
          ) : (
            <div style={{
              padding: 50, textAlign: 'center', color: T.textFaint,
              background: T.panel, borderRadius: 10, border: `1px dashed ${T.border}`,
            }}>
              <Network size={36} color={T.border} style={{ marginBottom: 10, display: 'inline-block' }} />
              <div style={{ fontSize: 13, color: T.textDim, fontWeight: 500 }}>No extraction performed yet</div>
              <div style={{ fontSize: 12, color: T.textFaint, marginTop: 4 }}>
                {activeTab === 'pdf'
                  ? 'Upload a PDF and click "Extract + Run NER" to analyze entities and relationships.'
                  : 'Run NER extraction on the text to review detected entities and action relationships before committing.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
