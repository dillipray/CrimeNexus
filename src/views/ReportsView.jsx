import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  ClipboardList,
  Download,
  Loader2,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { T, ENTITIES, RELATIONSHIPS, TIMELINE } from '../data/mockData';

export default function ReportsView({ leads, resolutions, activeCase, currentRole }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);
  const [note, setNote] = useState("Investigator reviewed high-betweenness bridge entity and structured transaction alert TXN-311. Evidence submitted for formal supervision file.");
  const [downloading, setDownloading] = useState(false);

  const sections = [
    {
      title: "Case Context & Classification",
      tag: "OBSERVED",
      body: `${activeCase} · Active Investigation · Investigating Unit: Organized Crime & Financial Intelligence · Officer: ${currentRole.user} (${currentRole.name})`,
    },
    {
      title: "Evidence Inventory Audit",
      tag: "OBSERVED",
      body: "248 validated evidentiary items: CDR tower logs (Nagpur Central), NEFT transaction batch records, and physical surveillance logs.",
    },
    {
      title: "Extracted Knowledge Graph Entities",
      tag: "AI",
      body: `${Object.keys(ENTITIES).length} discrete entities resolved: 5 Persons of Interest, 3 Registered Telephony Endpoints, 1 Linked Vehicle, 2 Observed Geographies, 1 Corporate Entity.`,
    },
    {
      title: "Network Centrality & Brokerage Findings",
      tag: "AI",
      body: "Brandes' algorithm identified Meera Sen as the primary bridge entity (Betweenness Centrality: 8.5), linking distinct commercial and logistics sub-networks.",
    },
    {
      title: "Suspicious Pattern Detection",
      tag: "AI",
      body: `${leads.length} automated leads flagged, including structured transfer layering (TXN-311) and anomalous CDR frequency surges.`,
    },
    {
      title: "Entity Resolution Status",
      tag: "REVIEW",
      body: `${resolutions.filter((m) => m.status === "merged").length} duplicate matches confirmed by human triage with reversible audit logs.`,
    },
    {
      title: "Investigator Attestation & Observations",
      tag: "REVIEW",
      body: null,
    },
  ];

  const tagColors = {
    OBSERVED: { label: "Observed Evidence", color: T.textDim, bg: T.panelAlt },
    AI: { label: "AI Analysis", color: T.flag, bg: T.flagDim },
    REVIEW: { label: "Investigator Review", color: T.signal, bg: T.signalDim },
  };

  const handleExportPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(14, 22, 31);
      doc.rect(0, 0, pageWidth, 42, "F");

      doc.setTextColor(63, 193, 201);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("NEXUS INTEL — INVESTIGATIVE ANALYSIS REPORT", 14, 18);

      doc.setTextColor(230, 237, 244);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Case Reference: ${activeCase}  |  Date: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text(`Investigating Officer: ${currentRole.user} (${currentRole.name})`, 14, 36);

      // Mandatory Legal Notice
      let y = 52;
      doc.setFillColor(232, 163, 61, 0.15);
      doc.setDrawColor(232, 163, 61);
      doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, "FD");

      doc.setTextColor(180, 100, 20);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text(
        "MANDATORY NOTICE: AI-assisted analytical report for authorized human review; not a final legal conclusion.",
        18,
        y + 10
      );

      y += 26;

      // Sections
      doc.setTextColor(20, 31, 43);
      sections.forEach((sec) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${sec.title} [${sec.tag}]`, 14, y);
        y += 6;

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        const content = sec.title === "Investigator Attestation & Observations" ? note : sec.body;
        const lines = doc.splitTextToSize(content || "None", pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 8;
      });

      // Signature Block
      if (y > 250) {
        doc.addPage();
        y = 30;
      }
      y += 10;
      doc.setDrawColor(180, 190, 200);
      doc.line(14, y, 90, y);
      doc.setFontSize(9);
      doc.text(`Authorized Sign-off: ${currentRole.user}`, 14, y + 6);
      doc.text(`Designation: ${currentRole.name}`, 14, y + 11);

      doc.save(`NexusIntel_Report_${activeCase}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 880 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Formal Investigation Report</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            Compilation of case evidence, network centrality metrics, AI findings, and human investigator attestation
          </div>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={downloading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: T.signalDim,
            border: `1px solid ${T.signal}66`,
            color: T.signal,
            borderRadius: 7,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {downloading ? <Loader2 size={14} className="spin" /> : <Download size={14} />}
          {downloading ? "Generating PDF..." : "Export Formal PDF"}
        </button>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div
        style={{
          background: T.flagDim,
          border: `1px solid ${T.flag}66`,
          borderRadius: 8,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ShieldCheck size={18} color={T.flag} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>
          <strong>Statutory Disclaimer:</strong> AI-assisted analytical report for authorized human review; not a final legal conclusion. System provides investigative decision-support only.
        </div>
      </div>

      {/* Report Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sections.map((s) => {
          const meta = tagColors[s.tag];
          return (
            <div key={s.title} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</span>
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: meta.color,
                  background: meta.bg,
                  padding: "2px 7px",
                  borderRadius: 4,
                  border: `1px solid ${meta.color}33`,
                }}>
                  {meta.label}
                </span>
              </div>

              {s.body && (
                <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.6 }}>{s.body}</div>
              )}

              {s.title === "Investigator Attestation & Observations" && (
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter officer notes for submission..."
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: T.panelAlt,
                    border: `1px solid ${T.borderSoft}`,
                    borderRadius: 6,
                    padding: 10,
                    color: T.text,
                    fontSize: 12.5,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
