import React, { useState, useEffect, useMemo } from 'react';
import {
  T,
  ENTITIES,
  RELATIONSHIPS,
  LEADS_INIT,
  RESOLUTION_QUEUE,
} from './data/mockData';

import TopBar, { ROLES, CASES } from './components/TopBar';
import LeftNav from './components/LeftNav';

import DashboardView from './views/DashboardView';
import GraphView from './views/GraphView';
import TimelineView from './views/TimelineView';
import LeadsView from './views/LeadsView';
import CommsFinancialView from './views/CommsFinancialView';
import MapView from './views/MapView';
import SearchView from './views/SearchView';
import ResolutionView from './views/ResolutionView';
import AnalyticsView from './views/AnalyticsView';
import UploadIngestionView from './views/UploadIngestionView';
import ReportsView from './views/ReportsView';
import AuditView from './views/AuditView';

import { checkBackendHealth, fetchAlerts, fetchDuplicates } from './services/api';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [activeCase, setActiveCase] = useState('CASE-2026-001');
  const [currentRole, setCurrentRole] = useState(ROLES[0]); // Investigating Officer (R. Basu)

  // Graph state
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [relFilter, setRelFilter] = useState('all');

  // Search & Navigation
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Leads & Resolutions
  const [leads, setLeads] = useState(LEADS_INIT);
  const [expandedTrace, setExpandedTrace] = useState(null);
  const [showDup, setShowDup] = useState(true);
  const [resolutions, setResolutions] = useState(RESOLUTION_QUEUE);

  // Backend connection status
  const [backendConnected, setBackendConnected] = useState(false);

  // Initial check & heartbeat
  useEffect(() => {
    let mounted = true;
    const testConnection = async () => {
      const health = await checkBackendHealth();
      if (mounted) {
        setBackendConnected(!!health);
      }
    };
    testConnection();
    const interval = setInterval(testConnection, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Quick search autocomplete dropdown
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return Object.entries(ENTITIES)
      .filter(([, e]) => e.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [search]);

  const pendingReview = leads.filter((l) => l.status === 'review').length;
  const pendingMatches = resolutions.filter((m) => m.status === 'pending').length;

  function selectEntity(key) {
    setSelectedNode(key);
    setSelectedEdge(null);
    setTab('graph');
  }

  function handleSearchEnter(query) {
    setSearchQuery(query);
    setTab('search');
  }

  function setMatchStatus(id, status) {
    setResolutions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  }

  return (
    <div
      style={{
        background: T.bg,
        color: T.text,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ---------------- TOP BAR ---------------- */}
      <TopBar
        activeCase={activeCase}
        setActiveCase={setActiveCase}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        search={search}
        setSearch={setSearch}
        searchResults={searchResults}
        onSelectEntity={selectEntity}
        onSearchEnter={handleSearchEnter}
        backendConnected={backendConnected}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* ---------------- LEFT NAV ---------------- */}
        <LeftNav
          currentTab={tab}
          setTab={setTab}
          pendingLeadsCount={pendingReview}
          pendingMatchesCount={pendingMatches}
        />

        {/* ---------------- MAIN CONTENT ---------------- */}
        <div style={{ flex: 1, overflow: 'auto', padding: 22, minWidth: 0 }}>
          <div key={tab} className="tabpane">
            {tab === 'dashboard' && (
              <DashboardView
                leads={leads}
                onOpenLead={() => setTab('leads')}
                onSelectEntity={selectEntity}
                showDup={showDup}
                setShowDup={setShowDup}
                pendingMatches={pendingMatches}
                onOpenResolution={() => setTab('resolution')}
                activeCase={activeCase}
                currentRole={currentRole}
              />
            )}

            {tab === 'graph' && (
              <GraphView
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                selectedEdge={selectedEdge}
                setSelectedEdge={setSelectedEdge}
                relFilter={relFilter}
                setRelFilter={setRelFilter}
                onSelectEntity={selectEntity}
              />
            )}

            {tab === 'timeline' && <TimelineView />}

            {tab === 'leads' && (
              <LeadsView
                leads={leads}
                setLeads={setLeads}
                expandedTrace={expandedTrace}
                setExpandedTrace={setExpandedTrace}
                onSelectEntity={selectEntity}
                currentRole={currentRole}
              />
            )}

            {tab === 'comms' && <CommsFinancialView initialSubTab="comms" />}

            {tab === 'financial' && <CommsFinancialView initialSubTab="financial" />}

            {tab === 'map' && <MapView onSelectEntity={selectEntity} />}

            {tab === 'search' && (
              <SearchView
                initialQuery={searchQuery}
                onSelectEntity={selectEntity}
                currentRole={currentRole}
              />
            )}

            {tab === 'resolution' && (
              <ResolutionView
                matches={resolutions}
                setMatchStatus={setMatchStatus}
                onSelectEntity={selectEntity}
                currentRole={currentRole}
              />
            )}

            {tab === 'analytics' && <AnalyticsView onSelectEntity={selectEntity} />}

            {tab === 'ingestion' && <UploadIngestionView onSelectEntity={selectEntity} />}

            {tab === 'reports' && (
              <ReportsView
                leads={leads}
                resolutions={resolutions}
                activeCase={activeCase}
                currentRole={currentRole}
              />
            )}

            {tab === 'audit' && <AuditView />}
          </div>
        </div>
      </div>
    </div>
  );
}
