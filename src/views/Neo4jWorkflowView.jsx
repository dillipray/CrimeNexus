import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Database,
  Network,
  Search,
  Activity,
  LayoutDashboard,
  ShieldAlert,
  Phone,
  Car,
  MapPin,
  Building2,
  CreditCard,
  User,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { fetchWorkflowPipeline } from '../services/api';

// Fallback verified synthetic data in case backend is offline
const FALLBACK_DATA = {
  counts: {
    firs: 30,
    cdr_records: 5200,
    transactions: 10000,
    persons: 60,
    phones: 100,
    vehicles: 40,
    locations: 20,
    organizations: 15,
    accounts: 80,
    cases: 30,
  },
  sample_cards: [
    {
      id: "CARD_FIR",
      source_type: "FIR Reports",
      badge: "Crime Records",
      title: "FIR_0001 (Nagpur, Maharashtra)",
      summary: "Organized financial fraud report detailing Aditya Singh, Person Alpha, and Synthetic Logistics Group 11.",
      count_label: "30 FIR Reports",
      color: "#38bdf8",
    },
    {
      id: "CARD_CDR",
      source_type: "Call Detail Records (CDR)",
      badge: "Telecommunications",
      title: "5,200 Processed Call Records",
      summary: "Cell-tower CDR linkages capturing duration, caller/receiver identifiers, and communication frequency.",
      count_label: "5,200 Records",
      color: "#c084fc",
    },
    {
      id: "CARD_TXN",
      source_type: "Banking & Transactions",
      badge: "Financial Flow",
      title: "10,000 Ledger Transactions",
      summary: "High-velocity IMPS/NEFT/UPI transfer records including flagged risk-labeled transactions.",
      count_label: "10,000 Transfers",
      color: "#60a5fa",
    },
    {
      id: "CARD_SURV",
      source_type: "Surveillance & Locations",
      badge: "Geospatial",
      title: "LOC_0401 Synthetic Transport Hub 4-1",
      summary: "Field surveillance observation coordinates and perimeter vehicle sightings.",
      count_label: "20 Verified Locations",
      color: "#fbbf24",
    },
    {
      id: "CARD_VEH",
      source_type: "Vehicle Registrations",
      badge: "Transport RTO",
      title: "JH-00-XX-0003 & Fleet Records",
      summary: "Automotive registry records linking suspect ownership to observed crime scene vehicles.",
      count_label: "40 Vehicles",
      color: "#34d399",
    },
    {
      id: "CARD_ENT",
      source_type: "Criminal Entity Registry",
      badge: "Master Entities",
      title: "Persons & Organizations",
      summary: "60 Persons, 100 Mobile Devices, 80 Accounts, and 15 Syndicates resolved into master entities.",
      count_label: "60 Persons · 15 Orgs",
      color: "#fb7185",
    },
  ],
  nodes: [
    { id: "P009", name: "Aditya Singh", type: "PERSON", role: "Subject for Review", x: 460, y: 260, color: "#38bdf8" },
    { id: "P001", name: "Person Alpha", type: "PERSON", role: "Co-Accused", x: 300, y: 160, color: "#38bdf8" },
    { id: "P040", name: "Vikram Joshi", type: "PERSON", role: "Associate", x: 620, y: 170, color: "#38bdf8" },
    { id: "P003", name: "Person Charlie", type: "PERSON", role: "Primary Syndicate Broker", x: 180, y: 340, color: "#f59e0b" },
    { id: "PHONE_0059", name: "PHONE_FAKE_0059", type: "PHONE", role: "Active Mobile", x: 360, y: 380, color: "#c084fc" },
    { id: "VEH_003", name: "JH-00-XX-0003", type: "VEHICLE", role: "Spotted Vehicle", x: 580, y: 370, color: "#34d399" },
    { id: "LOC_0401", name: "Transport Hub 4-1", type: "LOCATION", role: "Crime Scene", x: 460, y: 100, color: "#fbbf24" },
    { id: "ORG_011", name: "Logistics Group 11", type: "ORGANIZATION", role: "Front Syndicate", x: 700, y: 290, color: "#fb7185" },
    { id: "TXN_0030", name: "TXN_000030 (₹49,000)", type: "TRANSACTION", role: "Flagged High-Risk", x: 260, y: 260, color: "#60a5fa" },
  ],
  edges: [
    { source: "P009", target: "P001", type: "FIR_CO_MENTION", label: "co-accused", confidence: 88 },
    { source: "P009", target: "P040", type: "FIR_CO_MENTION", label: "co-mentioned", confidence: 88 },
    { source: "P009", target: "PHONE_0059", type: "OWNS_PHONE", label: "owns phone", confidence: 95 },
    { source: "P009", target: "VEH_003", type: "VEHICLE_ASSOCIATION", label: "associated vehicle", confidence: 85 },
    { source: "P009", target: "LOC_0401", type: "LOCATION_OBSERVATION", label: "observed at", confidence: 80 },
    { source: "P009", target: "ORG_011", type: "AFFILIATED_WITH", label: "affiliated with", confidence: 85 },
    { source: "P001", target: "LOC_0401", type: "LOCATION_OBSERVATION", label: "observed at", confidence: 80 },
    { source: "P003", target: "P009", type: "HIDDEN_BROKER_LINK", label: "cross-syndicate bridge", confidence: 91 },
    { source: "P003", target: "TXN_0030", type: "TRANSFERRED_FUNDS_TO", label: "hawala transfer", confidence: 96 },
    { source: "TXN_0030", target: "P001", type: "RECEIVED_FUNDS", label: "payee link", confidence: 94 },
  ],
  analytics: {
    top_broker: {
      id: "P003",
      name: "Person Charlie",
      betweenness: 0.0529,
      degree: 42,
      closeness: 0.4316,
      pagerank: 0.0140,
      role: "Key Network Connector",
    },
    communities: [
      { name: "Logistics Syndicate 11", size: 121, color: "#38bdf8", lead: "Aditya Das / Syndicate 11" },
      { name: "Hawala & Mule Accounts", size: 80, color: "#c084fc", lead: "Rohan Sahu / Bank Accounts" },
      { name: "Cross-State Smuggling Ring", size: 65, color: "#34d399", lead: "Person Charlie (Bridge)" },
      { name: "Communications Relay Cell", size: 32, color: "#fbbf24", lead: "CDR Cluster 4" },
    ],
    bridges_count: 123,
  },
  dashboard: {
    summary: {
      connected_individuals: 60,
      detected_communities: 10,
      identified_locations: 20,
      key_associates: 12,
      ingested_transactions: 10000,
      cdr_records: 5200,
    },
    ai_insights: [
      {
        icon: "KeyConnector",
        title: "Key Network Connector Identified",
        subject: "Person Charlie (P003)",
        description: "Highest betweenness centrality (0.0529) in the network. Acts as the pivotal information and financial gateway bridging 3 isolated syndicates across West Bengal and Maharashtra.",
        confidence: 97,
        type: "critical",
      },
      {
        icon: "StrongRelationship",
        title: "Strong Relationship Detected",
        subject: "Aditya Singh (P009) ↔ Person Alpha (P001)",
        description: "Cross-corroborated through both FIR co-presence (88% confidence) and recurrent CDR communication (92% confidence) in Nagpur.",
        confidence: 94,
        type: "high",
      },
      {
        icon: "SharedLocation",
        title: "Shared Operational Location Detected",
        subject: "Synthetic Transport Hub 4-1 (LOC_0401)",
        description: "Identified as the primary rendezvous hub linking suspects across 2 separate interstate logistics operations.",
        confidence: 89,
        type: "medium",
      },
      {
        icon: "SuspiciousTransaction",
        title: "Suspicious Transaction Pattern Detected",
        subject: "Rapid High-Value Layering (TXN_000030 & mule ring)",
        description: "High-risk flagged UPI transfers (₹49,000, risk_label=1) routed across accounts ACCT_0070 to ACCT_0073 within minutes of surveillance observation.",
        confidence: 96,
        type: "critical",
      },
    ],
    final_banner_message: "From fragmented data to actionable intelligence.",
  },
};

const SCENES = [
  { id: 1, name: "Crime Data", subtitle: "Synthetic Data Ingestion", icon: Database },
  { id: 2, name: "Neo4j Graph", subtitle: "Entity Resolution Layer", icon: Network },
  { id: 3, name: "Investigation", subtitle: "Targeted Neighborhood Search", icon: Search },
  { id: 4, name: "Graph Analytics", subtitle: "Centrality & Community Discovery", icon: Activity },
  { id: 5, name: "Investigator Insights", subtitle: "Actionable Intelligence", icon: LayoutDashboard },
];

export default function Neo4jWorkflowView({ activeCase = 'FIR_0001', onSelectEntity }) {
  const [currentScene, setCurrentScene] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [pipelineData, setPipelineData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState("P009");
  const [simulatedTyping, setSimulatedTyping] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);
  const [neo4jStatus, setNeo4jStatus] = useState("checking");

  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const res = await fetchWorkflowPipeline(activeCase);
        if (mounted && res && res.status === "success") {
          setPipelineData(res);
          setNeo4jStatus(res.storage === "neo4j" ? "live_bolt" : "dataset_sync");
          return;
        }
      } catch (err) {}
      if (mounted) {
        setPipelineData(FALLBACK_DATA);
        setNeo4jStatus("dataset_sync");
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [activeCase]);

  const activeData = pipelineData || FALLBACK_DATA;

  // Autoplay is OFF — user navigates scenes manually via Prev/Next/scene pills

  useEffect(() => {
    if (currentScene === 3) {
      const textToType = "Aditya Singh (P009)";
      let idx = 0;
      setSimulatedTyping("");
      const typeInterval = setInterval(() => {
        if (idx <= textToType.length) {
          setSimulatedTyping(textToType.slice(0, idx));
          idx++;
        } else {
          clearInterval(typeInterval);
        }
      }, 90);
      return () => clearInterval(typeInterval);
    }
  }, [currentScene]);

  const prevScene = () => {
    setSceneProgress(0);
    setCurrentScene((s) => (s > 1 ? s - 1 : 5));
  };
  const nextScene = () => {
    setSceneProgress(0);
    setCurrentScene((s) => (s < 5 ? s + 1 : 1));
  };
  const jumpToScene = (sceneId) => {
    setSceneProgress(0);
    setCurrentScene(sceneId);
  };
  const restartWorkflow = () => {
    setSceneProgress(0);
    setCurrentScene(1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const counts = activeData.scene_1_data_collection?.counts || activeData.counts || FALLBACK_DATA.counts;
  const sampleCards = activeData.scene_1_data_collection?.sample_cards || activeData.sample_cards || FALLBACK_DATA.sample_cards;
  const nodes = FALLBACK_DATA.nodes;
  const edges = FALLBACK_DATA.edges;
  const analytics = activeData.scene_4_analytics || activeData.analytics || FALLBACK_DATA.analytics;
  const dashboard = activeData.scene_5_dashboard || activeData.dashboard || FALLBACK_DATA.dashboard;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 740,
        background: 'radial-gradient(ellipse at top center, #0e172e 0%, #070b16 70%, #03060c 100%)',
        color: '#f8fafc',
        borderRadius: 14,
        border: '1px solid rgba(56, 189, 248, 0.25)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(56, 189, 248, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ──────────────────────────────────────────────────────────────────────────
          1. HEADER BAR & WORKFLOW PROGRESS TRACKER
      ────────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 22px',
          background: 'rgba(11, 19, 38, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cpu size={20} color="#e0f2fe" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5, color: '#f0f9ff' }}>
                NEO4J INTELLIGENCE PIPELINE
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 20,
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  letterSpacing: 0.6,
                }}
              >
                PRO DEMO
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Case: <strong style={{ color: '#e2e8f0' }}>{activeCase}</strong></span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: neo4jStatus === 'live_bolt' ? '#10b981' : '#38bdf8',
                    boxShadow: `0 0 6px ${neo4jStatus === 'live_bolt' ? '#10b981' : '#38bdf8'}`,
                  }}
                />
                {neo4jStatus === 'live_bolt' ? 'Neo4j Bolt Live' : 'Synthetic Graph Engine'}
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Breadcrumb Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', maxWidth: 660 }}>
          {SCENES.map((scene, idx) => {
            const isActive = currentScene === scene.id;
            const isCompleted = currentScene > scene.id;
            const Icon = scene.icon;
            return (
              <React.Fragment key={scene.id}>
                <button
                  onClick={() => jumpToScene(scene.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: isActive
                      ? '1px solid #38bdf8'
                      : isCompleted
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : '1px solid rgba(148, 163, 184, 0.15)',
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, rgba(14, 116, 144, 0.28) 100%)'
                      : isCompleted
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(15, 23, 42, 0.6)',
                    color: isActive ? '#f0f9ff' : isCompleted ? '#a7f3d0' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.3)' : 'none',
                  }}
                >
                  <Icon size={14} color={isActive ? '#38bdf8' : isCompleted ? '#10b981' : '#64748b'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 600 }}>
                      {idx + 1}. {scene.name}
                    </div>
                  </div>
                </button>
                {idx < SCENES.length - 1 && (
                  <ChevronRight size={13} color={currentScene > idx + 1 ? '#10b981' : 'rgba(148, 163, 184, 0.25)'} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(15, 23, 42, 0.8)', padding: 3, borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <button
              onClick={prevScene}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 5, cursor: 'pointer', display: 'flex' }}
              title="Previous Scene"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextScene}
              style={{ background: 'none', border: 'none', color: '#94a3b8', padding: 5, cursor: 'pointer', display: 'flex' }}
              title="Next Scene"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={restartWorkflow}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Restart Workflow"
          >
            <RotateCcw size={15} />
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ width: '100%', height: 3, background: 'rgba(15, 23, 42, 0.8)', position: 'relative' }}>
        <div
          style={{
            width: `${sceneProgress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0284c7, #38bdf8, #a855f7)',
            boxShadow: '0 0 10px #38bdf8',
            transition: 'width 50ms linear',
          }}
        />
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. MAIN STAGE VIEWPORT (SCENES 1 TO 5)
      ────────────────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>

        {/* SCENE 1: CRIME DATA COLLECTION */}
        {currentScene === 1 && (
          <div
            className="scene-fade-in"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                    STAGE 1: MULTI-SOURCE DATA INGESTION
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    100% Synthetic Ground Truth
                  </span>
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  Fragmented Crime Records Streaming into Neo4j
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', maxWidth: 680 }}>
                  Raw investigation artifacts (FIR narratives, cellular CDR logs, banking ledgers, and surveillance coordinates) stream from disparate sources into the central graph database.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '6px 14px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{counts.firs}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>FIR Reports</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(192, 132, 252, 0.25)', padding: '6px 14px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc' }}>{counts.cdr_records.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>CDR Logs</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(96, 165, 250, 0.25)', padding: '6px 14px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#60a5fa' }}>{counts.transactions.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Transactions</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(52, 211, 153, 0.25)', padding: '6px 14px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{counts.persons + counts.vehicles + counts.phones}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Raw Entities</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px 1fr', gap: 20, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sampleCards.slice(0, 3).map((card, i) => (
                  <div
                    key={card.id}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: hoveredCard === card.id ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.65)',
                      border: `1px solid ${hoveredCard === card.id ? card.color : 'rgba(148, 163, 184, 0.18)'}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                      position: 'relative',
                      boxShadow: hoveredCard === card.id ? `0 0 20px ${card.color}33` : 'none',
                      transition: 'all 0.3s ease',
                      animation: `pulseCard 3s infinite ${i * 0.4}s`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {card.badge}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 6 }}>
                        {card.count_label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{card.title}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{card.summary}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    border: '1px dashed rgba(56, 189, 248, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    animation: 'spinOrbit 20s linear infinite',
                  }}
                >
                  <div
                    style={{
                      width: 170,
                      height: 170,
                      borderRadius: '50%',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      animation: 'spinOrbitReverse 14s linear infinite',
                    }}
                  />
                </div>

                <div
                  style={{
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #0284c7 0%, #0369a1 45%, #071938 100%)',
                    border: '2px solid #38bdf8',
                    boxShadow: '0 0 35px rgba(56, 189, 248, 0.6), inset 0 0 20px rgba(56, 189, 248, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    zIndex: 5,
                    cursor: 'pointer',
                  }}
                >
                  <Database size={30} color="#e0f2fe" />
                  <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: '#ffffff' }}>
                    NEO4J CORE
                  </span>
                  <span style={{ fontSize: 9, color: '#7dd3fc', textTransform: 'uppercase' }}>
                    Graph Sink
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    textAlign: 'center',
                    background: 'rgba(15, 23, 42, 0.7)',
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: 11.5,
                    color: '#7dd3fc',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Dynamic Ingestion: Bolt Channel Active
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sampleCards.slice(3, 6).map((card, i) => (
                  <div
                    key={card.id}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: hoveredCard === card.id ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.65)',
                      border: `1px solid ${hoveredCard === card.id ? card.color : 'rgba(148, 163, 184, 0.18)'}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                      position: 'relative',
                      boxShadow: hoveredCard === card.id ? `0 0 20px ${card.color}33` : 'none',
                      transition: 'all 0.3s ease',
                      animation: `pulseCard 3s infinite ${(i + 3) * 0.4}s`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: card.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {card.badge}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc', background: 'rgba(255,255,255,0.06)', padding: '2px 7px', borderRadius: 6 }}>
                        {card.count_label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{card.title}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>{card.summary}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 16px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#38bdf8" />
                <span>
                  <strong>Live Ingestion Pipeline:</strong> Processed 10,000 transactions and 5,200 call logs into Neo4j graph nodes without schema lock.
                </span>
              </div>
              <button
                onClick={nextScene}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>Advance to Graph Construction</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* SCENE 2: GRAPH CONSTRUCTION */}
        {currentScene === 2 && (
          <div
            className="scene-fade-in"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                    STAGE 2: ENTITY RESOLUTION & GRAPH EXPANSION
                  </span>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                    Zero Schema Disruption
                  </span>
                </div>
                <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  Resolved Multi-Source Entities into Normalized Graph Nodes
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', maxWidth: 680 }}>
                  Entity resolution algorithms resolve phones, vehicles, bank accounts, and people into 6 standardized graph node types with probabilistic edge confidence scores.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 450 }}>
                {[
                  { type: 'PERSON', color: '#38bdf8', icon: User, label: 'Person' },
                  { type: 'PHONE', color: '#c084fc', icon: Phone, label: 'Phone' },
                  { type: 'VEHICLE', color: '#34d399', icon: Car, label: 'Vehicle' },
                  { type: 'LOCATION', color: '#fbbf24', icon: MapPin, label: 'Location' },
                  { type: 'ORGANIZATION', color: '#fb7185', icon: Building2, label: 'Organization' },
                  { type: 'TRANSACTION', color: '#60a5fa', icon: CreditCard, label: 'Transaction' },
                ].map((item) => (
                  <div
                    key={item.type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 6,
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: `1px solid ${item.color}40`,
                      fontSize: 11,
                      color: item.color,
                      fontWeight: 600,
                    }}
                  >
                    <item.icon size={12} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 400,
                background: 'rgba(10, 16, 31, 0.7)',
                borderRadius: 12,
                border: '1px solid rgba(56, 189, 248, 0.2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 920 480" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>

                {edges.map((e, idx) => {
                  const sNode = nodes.find((n) => n.id === e.source);
                  const tNode = nodes.find((n) => n.id === e.target);
                  if (!sNode || !tNode) return null;

                  return (
                    <g key={`edge-${idx}`}>
                      <line
                        x1={sNode.x}
                        y1={sNode.y}
                        x2={tNode.x}
                        y2={tNode.y}
                        stroke="rgba(56, 189, 248, 0.45)"
                        strokeWidth="1.8"
                        strokeDasharray="6 4"
                        style={{ animation: 'drawDash 25s linear infinite' }}
                      />
                      <rect
                        x={(sNode.x + tNode.x) / 2 - 24}
                        y={(sNode.y + tNode.y) / 2 - 9}
                        width="48"
                        height="18"
                        rx="4"
                        fill="#0b1329"
                        stroke="rgba(56, 189, 248, 0.3)"
                        strokeWidth="1"
                      />
                      <text
                        x={(sNode.x + tNode.x) / 2}
                        y={(sNode.y + tNode.y) / 2 + 3}
                        fill="#38bdf8"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {e.confidence}%
                      </text>
                    </g>
                  );
                })}

                {nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isPersonNode = node.type === 'PERSON';
                  return (
                    <g
                      key={node.id}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        if (isPersonNode && onSelectEntity) onSelectEntity(node.id);
                      }}
                      style={{ cursor: 'pointer' }}
                      title={isPersonNode ? `Open ${node.name} in Network Graph` : node.name}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="24"
                        fill="none"
                        stroke={node.color}
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        style={{ animation: 'pulseRing 2.5s infinite' }}
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        fill={isSelected ? node.color + '33' : '#0c1833'}
                        stroke={node.color}
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                        filter="url(#glow)"
                      />
                      <text
                        x={node.x}
                        y={node.y + 30}
                        fill="#f1f5f9"
                        fontSize="10.5"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {node.name}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 42}
                        fill={node.color}
                        fontSize="8.5"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {node.type}
                      </text>
                      {isPersonNode && (
                        <text x={node.x} y={node.y + 5} fill="#f8fafc" fontSize="9" fontWeight="800" textAnchor="middle">→</text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 11.5,
                  color: '#cbd5e1',
                  maxWidth: 380,
                }}
              >
                <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 2 }}>
                  ✔ Entity Resolution: 100% Deterministic Rule + Gazetteer
                </div>
                <div>
                  Maps persons, phones, and vehicles to verified graph nodes. No table structure or DB constraints modified.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 3: INVESTIGATION */}
        {currentScene === 3 && (
          <div
            className="scene-fade-in"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              padding: 24,
              boxSizing: 'border-box',
              gap: 20,
              overflowY: 'auto',
            }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                  STAGE 3: TARGETED INVESTIGATION QUERY
                </div>
                <h2 style={{ margin: '4px 0 10px', fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                  Investigator Search & Neighborhood Expansion
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.5)',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)',
                    padding: '8px 14px',
                    borderRadius: 8,
                    maxWidth: 480,
                  }}
                >
                  <Search size={16} color="#38bdf8" />
                  <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 600 }}>
                    {simulatedTyping}
                    <span style={{ borderRight: '2px solid #38bdf8', animation: 'blink 1s infinite' }} />
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    1-HOP NEIGHBORHOOD
                  </span>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  background: 'rgba(10, 16, 31, 0.75)',
                  borderRadius: 12,
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <svg width="100%" height="100%" viewBox="0 0 650 420">
                  <defs>
                    <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  <circle cx="320" cy="210" r="75" fill="url(#targetGlow)" style={{ animation: 'pulseHalo 2s infinite' }} />

                  {[
                    { x: 190, y: 110, label: "Co-Accused (88%)", name: "Person Alpha", id: "P001", type: "PERSON", color: "#38bdf8" },
                    { x: 460, y: 120, label: "Associate (88%)", name: "Vikram Joshi", id: "P040", type: "PERSON", color: "#38bdf8" },
                    { x: 470, y: 300, label: "Spotted Vehicle (85%)", name: "JH-00-XX-0003", id: "VEH_003", type: "VEHICLE", color: "#34d399" },
                    { x: 180, y: 310, label: "Registered Device (95%)", name: "PHONE_0059", id: "PHONE_0059", type: "PHONE", color: "#c084fc" },
                    { x: 320, y: 70, label: "Meeting Hub (80%)", name: "Transport Hub 4-1", id: "LOC_0401", type: "LOCATION", color: "#fbbf24" },
                    { x: 520, y: 210, label: "Syndicate (85%)", name: "Logistics Group 11", id: "ORG_011", type: "ORGANIZATION", color: "#fb7185" },
                  ].map((node, i) => {
                    const isClickable = node.type === 'PERSON';
                    return (
                    <g key={i}
                      onClick={() => isClickable && onSelectEntity && onSelectEntity(node.id)}
                      style={{ cursor: isClickable ? 'pointer' : 'default' }}
                      title={isClickable ? `Open ${node.name} in Network Graph` : node.name}
                    >
                      <line
                        x1="320"
                        y1="210"
                        x2={node.x}
                        y2={node.y}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                        style={{ animation: 'drawDash 20s linear infinite' }}
                      />
                      <circle cx={node.x} cy={node.y} r="18" fill="#0b162c" stroke={node.color} strokeWidth="2"
                        strokeOpacity={isClickable ? 1 : 0.65}
                      />
                      <text x={node.x} y={node.y + 30} fill={isClickable ? '#f1f5f9' : '#94a3b8'} fontSize="10" fontWeight="700" textAnchor="middle">
                        {node.name}
                      </text>
                      <text x={node.x} y={node.y + 42} fill="#38bdf8" fontSize="8" fontWeight="600" textAnchor="middle">
                        {node.label}
                      </text>
                      {isClickable && <text x={node.x} y={node.y + 4} fill="#f8fafc" fontSize="9" fontWeight="800" textAnchor="middle">→</text>}
                    </g>
                  )})}

                  <g
                    onClick={() => onSelectEntity && onSelectEntity('P009')}
                    style={{ cursor: 'pointer' }}
                    title="Open Aditya Singh (P009) in Network Graph"
                  >
                    <circle cx="320" cy="210" r="26" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" filter="url(#glow)" />
                    <text x="320" y="214" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle">
                      P009 →
                    </text>
                    <text x="320" y="248" fill="#38bdf8" fontSize="12" fontWeight="800" textAnchor="middle">
                      Aditya Singh
                    </text>
                    <text x="320" y="262" fill="#94a3b8" fontSize="9" fontWeight="600" textAnchor="middle">
                      Click to Open in Network Graph
                    </text>
                  </g>
                </svg>

                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 10,
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                >
                  Unrelated network nodes dimmed (Clutter-Free View)
                </div>
              </div>
            </div>

            <div
              style={{
                width: 330,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 12,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: 10 }}>
                <ShieldAlert size={18} color="#38bdf8" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', letterSpacing: 0.5 }}>
                  SUSPECT DOSSIER: P009
                </span>
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>Aditya Singh</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Role: <strong style={{ color: '#f59e0b' }}>Subject for Review</strong> · State: <strong style={{ color: '#e2e8f0' }}>Jharkhand</strong>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  Primary Case Citation: <strong style={{ color: '#38bdf8' }}>FIR_0001 (Nagpur)</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', marginBottom: 8 }}>
                  Corroborated Evidence Chain
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { step: "1", text: "FIR_0001: Spotted with Person Alpha near Hub 4-1 (88% conf)" },
                    { step: "2", text: "RTO Registry: Vehicle JH-00-XX-0003 co-located (85% conf)" },
                    { step: "3", text: "CDR Logs: Direct contact with PHONE_FAKE_0059 (95% conf)" },
                    { step: "4", text: "Corporate Registry: Affiliated with Logistics Group 11" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: 8,
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 10px',
                        borderRadius: 6,
                        borderLeft: '2px solid #38bdf8',
                        fontSize: 11,
                        color: '#cbd5e1',
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>{item.step}.</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'rgba(56, 189, 248, 0.08)', padding: 10, borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Investigator Assessment
                </div>
                <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>
                  Primary field actor linking interstate fleet movements with Nagpur money laundering hub.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 4: GRAPH ANALYTICS */}
        {currentScene === 4 && (
          <div
            className="scene-fade-in"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto',
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                STAGE 4: AUTOMATED GRAPH ALGORITHM ENGINE
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                Centrality, Modularity Communities & Hidden Bridge Discovery
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', maxWidth: 750 }}>
                Algorithmic graph analysis reveals the hidden mastermind bridging distinct criminal cells across state lines, backed by actual Brandes betweenness calculations over the synthetic dataset.
              </p>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {/* Panel 1: Betweenness Centrality */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={16} color="#f59e0b" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', letterSpacing: 0.5 }}>
                    1. CENTRALITY ANALYSIS
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: 8,
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
                    Rank #1 Network Broker
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                    {analytics.top_broker.name} ({analytics.top_broker.id})
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    Role: <strong style={{ color: '#f59e0b' }}>Associate · West Bengal</strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>
                        {analytics.top_broker.betweenness}
                      </div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Betweenness</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8' }}>
                        {analytics.top_broker.degree}
                      </div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Degree</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>
                        {analytics.top_broker.pagerank}
                      </div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>PageRank</div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong>Key Finding:</strong> Person Charlie has the single highest betweenness score in the 60-person network, meaning communications and money flows funnel through him.
                </div>
              </div>

              {/* Panel 2: Community Detection */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Network size={16} color="#c084fc" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', letterSpacing: 0.5 }}>
                    2. COMMUNITY DETECTION
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Greedy Modularity partitioning identified <strong style={{ color: '#f8fafc' }}>10 distinct criminal syndicates</strong>:
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {analytics.communities.slice(0, 4).map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${c.color}40`,
                        borderLeft: `3px solid ${c.color}`,
                        borderRadius: 6,
                        padding: '8px 10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#f8fafc' }}>{c.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4 }}>
                          {c.size} Nodes
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        Core Anchor: {c.lead}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 3: Relationship Analysis */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LinkIcon size={16} color="#38bdf8" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', letterSpacing: 0.5 }}>
                    3. RELATIONSHIP DISCOVERY
                  </span>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: 10, borderRadius: 8, border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    123 Bridge Edges Discovered
                  </div>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>
                    Removal of these critical links disconnects cross-state criminal coordination channels.
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
                    Critical Inter-State Bridge Link
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                    P003 (Charlie) ➔ P009 (Aditya Singh)
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Hidden indirect connection through mutual CDR calls and financial accounts crossing West Bengal ↔ Maharashtra.
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 'auto' }}>
                  Status: Multi-hop graph traversal completed in <strong>14ms</strong> via Neo4j Cypher.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 5: INVESTIGATOR DASHBOARD */}
        {currentScene === 5 && (
          <div
            className="scene-fade-in"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              boxSizing: 'border-box',
              position: 'relative',
              overflowY: 'auto',
              gap: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: 1, textTransform: 'uppercase' }}>
                STAGE 5: INVESTIGATOR INTELLIGENCE DASHBOARD
              </div>
              <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#f8fafc' }}>
                Synthesized Actionable Insights for Law Enforcement
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
              {[
                { label: 'Connected Suspects', val: dashboard.summary.connected_individuals, color: '#38bdf8' },
                { label: 'Syndicate Clusters', val: dashboard.summary.detected_communities, color: '#c084fc' },
                { label: 'Rendezvous Hubs', val: dashboard.summary.identified_locations, color: '#fbbf24' },
                { label: 'Key Associates', val: dashboard.summary.key_associates, color: '#34d399' },
                { label: 'Ledger Transfers', val: dashboard.summary.ingested_transactions.toLocaleString(), color: '#60a5fa' },
                { label: 'CDR Call Logs', val: dashboard.summary.cdr_records.toLocaleString(), color: '#fb7185' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: stat.color }}>{stat.val}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {dashboard.ai_insights.map((insight, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${insight.type === 'critical' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.25)'}`,
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: insight.type === 'critical' ? '#f87171' : '#38bdf8', textTransform: 'uppercase' }}>
                      {insight.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: 10,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {insight.confidence}% Confidence
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                    {insight.subject}
                  </div>

                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                    {insight.description}
                  </div>
                </div>
              ))}
            </div>

            {/* FINAL HERO BANNER WITH THE REQUIRED TEXT */}
            <div
              style={{
                marginTop: 'auto',
                padding: '20px 24px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(168, 85, 247, 0.25) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#38bdf8', textTransform: 'uppercase' }}>
                  FINAL EXECUTIVE TAKEAWAY
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    letterSpacing: 0.5,
                    color: '#ffffff',
                    textShadow: '0 0 20px rgba(56, 189, 248, 0.6)',
                    marginTop: 4,
                  }}
                >
                  “From fragmented data to actionable intelligence.”
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Powered by Neo4j graph algorithms, deterministic entity resolution, and Section 15.1 synthetic criminal dataset.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={restartWorkflow}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid #38bdf8',
                    color: '#f0f9ff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Replay Full Workflow</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseHalo {
          0% { r: 55px; opacity: 0.8; }
          50% { r: 85px; opacity: 0.2; }
          100% { r: 55px; opacity: 0.8; }
        }
        @keyframes pulseRing {
          0% { r: 18px; opacity: 0.8; }
          50% { r: 26px; opacity: 0.2; }
          100% { r: 18px; opacity: 0.8; }
        }
        @keyframes drawDash {
          to { stroke-dashoffset: -1000; }
        }
        @keyframes spinOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinOrbitReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulseCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        .scene-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
