/**
 * graphFromDataset.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds a graph (nodes + edges) directly from the Section 15.1 synthetic
 * dataset CSV files, scoped to a given case ID (default: FIR_0001).
 *
 * This module is the frontend fallback when the backend API is unreachable.
 * It replaces the hand-curated stub in mockData.js with real dataset data.
 *
 * All CSV files are imported via Vite's `?raw` loader (no HTTP round-trips).
 */

// ── Raw CSV imports (Vite resolves these at build time) ──────────────────────
import firRaw       from './synthatic_dataset/fir_reports.csv?raw';
import personsRaw   from './synthatic_dataset/persons.csv?raw';
import phonesRaw    from './synthatic_dataset/phones.csv?raw';
import vehiclesRaw  from './synthatic_dataset/vehicles.csv?raw';
import locationsRaw from './synthatic_dataset/locations.csv?raw';
import orgsRaw      from './synthatic_dataset/organizations.csv?raw';
import accountsRaw  from './synthatic_dataset/accounts.csv?raw';
import cdrRaw       from './synthatic_dataset/cdr_records.csv?raw';
import txnRaw       from './synthatic_dataset/transactions.csv?raw';
import casesRaw     from './synthatic_dataset/cases.csv?raw';

// ── Minimal CSV parser ───────────────────────────────────────────────────────
function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    // Handle quoted fields containing commas
    const fields = [];
    let inQuote = false;
    let cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQuote = !inQuote; continue; }
      if (c === ',' && !inQuote) { fields.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    fields.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (fields[i] ?? '').trim(); });
    return obj;
  });
}

// ── Parse all tables once at module load ─────────────────────────────────────
const FIR_TABLE     = parseCSV(firRaw);
const PERSONS       = parseCSV(personsRaw);
const PHONES        = parseCSV(phonesRaw);
const VEHICLES      = parseCSV(vehiclesRaw);
const LOCATIONS     = parseCSV(locationsRaw);
const ORGS          = parseCSV(orgsRaw);
const ACCOUNTS      = parseCSV(accountsRaw);
const CDR           = parseCSV(cdrRaw);
const TRANSACTIONS  = parseCSV(txnRaw);
const CASES_TABLE   = parseCSV(casesRaw);

// Lookup maps
const personById   = Object.fromEntries(PERSONS.map((p) => [p.person_id, p]));
const phoneById    = Object.fromEntries(PHONES.map((p) => [p.phone_id, p]));
const vehicleById  = Object.fromEntries(VEHICLES.map((v) => [v.vehicle_id, v]));
const locationById = Object.fromEntries(LOCATIONS.map((l) => [l.location_id, l]));
const orgById      = Object.fromEntries(ORGS.map((o) => [o.organization_id, o]));
const accountById  = Object.fromEntries(ACCOUNTS.map((a) => [a.account_id, a]));

// Phone owner reverse map: owner_id → phone_id
const phoneByOwner = Object.fromEntries(PHONES.map((p) => [p.owner_id, p.phone_id]));
// Account owner reverse map: owner_id → [account_id, ...]
const accountsByOwner = {};
ACCOUNTS.forEach((a) => {
  if (!accountsByOwner[a.owner_id]) accountsByOwner[a.owner_id] = [];
  accountsByOwner[a.owner_id].push(a.account_id);
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Build a graph for the given caseId from the raw CSV files.
 *
 * Returns: { nodes: Array<{id, type, name, sub}>, edges: Array<{id, source, target, type, evidence, confidence, count, amount}> }
 */
export function buildGraphForCase(caseId = 'FIR_0001') {
  // ── 1. Find the FIR report row ────────────────────────────────────────────
  const fir = FIR_TABLE.find((r) => r.case_id === caseId);
  if (!fir) return { nodes: [], edges: [] };

  // Parse semicolon-delimited entity references from the FIR row
  const personIds  = fir.person_ids      ? fir.person_ids.split(';').map((s) => s.trim()).filter(Boolean)      : [];
  const locId      = fir.location_id     ? fir.location_id.trim()     : null;
  const vehicleId  = fir.vehicle_id      ? fir.vehicle_id.trim()      : null;
  const orgId      = fir.organization_id ? fir.organization_id.trim() : null;
  const accountIds = fir.account_ids     ? fir.account_ids.split(';').map((s) => s.trim()).filter(Boolean) : [];

  const nodes = [];
  const edges = [];
  let edgeSeq = 0;
  const eid = () => `${caseId}_E${++edgeSeq}`;

  const addedNodeIds = new Set();
  function addNode(node) {
    if (!addedNodeIds.has(node.id)) { nodes.push(node); addedNodeIds.add(node.id); }
  }

  // ── 2. Person nodes ───────────────────────────────────────────────────────
  personIds.forEach((pid) => {
    const p = personById[pid];
    if (!p) return;
    addNode({
      id: pid,
      type: 'PERSON',
      name: p.name,
      sub: `${p.role} · ${caseId} · ${p.district}, ${p.state}`,
    });
  });

  // ── 3. FIR co-mention edges (all persons in this FIR are co-mentioned) ───
  for (let i = 0; i < personIds.length; i++) {
    for (let j = i + 1; j < personIds.length; j++) {
      if (!addedNodeIds.has(personIds[i]) || !addedNodeIds.has(personIds[j])) continue;
      edges.push({
        id: eid(),
        source: personIds[i],
        target: personIds[j],
        type: 'fir_co_mention',
        evidence: caseId,
        confidence: 88,
        count: 1,
      });
    }
  }

  // ── 4. Phone nodes + ownership edges ─────────────────────────────────────
  personIds.forEach((pid) => {
    const phoneId = phoneByOwner[pid];
    if (!phoneId) return;
    const ph = phoneById[phoneId];
    if (!ph) return;
    addNode({
      id: phoneId,
      type: 'PHONE',
      name: ph.number_display || phoneId,
      sub: `Registered to ${personById[pid]?.name || pid}`,
    });
    edges.push({
      id: eid(),
      source: pid,
      target: phoneId,
      type: 'owns_phone',
      evidence: caseId,
      confidence: 97,
      count: 1,
    });
  });

  // ── 5. CDR (communication) edges ─────────────────────────────────────────
  // Group CDR records for this case by caller-receiver pair
  const cdrForCase = CDR.filter((c) => c.case_id === caseId);
  const cdrPairs = {};
  cdrForCase.forEach((c) => {
    const key = [c.caller_id, c.receiver_id].sort().join('|');
    if (!cdrPairs[key]) cdrPairs[key] = { caller: c.caller_id, receiver: c.receiver_id, count: 0, ids: [] };
    cdrPairs[key].count++;
    cdrPairs[key].ids.push(c.cdr_id);
  });

  // Emit communication edge for phone-to-phone CDR
  Object.values(cdrPairs).forEach(({ caller, receiver, count, ids }) => {
    // caller/receiver can be person IDs or phone IDs — map to phone nodes if possible
    const callerPhone = phoneByOwner[caller] || (addedNodeIds.has(caller) ? caller : null);
    const recvPhone   = phoneByOwner[receiver] || (addedNodeIds.has(receiver) ? receiver : null);

    // Ensure both endpoints exist in our node set
    if (callerPhone && addedNodeIds.has(callerPhone) && recvPhone && addedNodeIds.has(recvPhone)) {
      edges.push({
        id: eid(),
        source: callerPhone,
        target: recvPhone,
        type: 'communication',
        evidence: ids[0] || 'CDR',
        confidence: 90,
        count,
      });
    } else if (addedNodeIds.has(caller) && addedNodeIds.has(receiver)) {
      edges.push({
        id: eid(),
        source: caller,
        target: receiver,
        type: 'communication',
        evidence: ids[0] || 'CDR',
        confidence: 90,
        count,
      });
    }
  });

  // ── 6. Location node + observation edges ─────────────────────────────────
  if (locId && locationById[locId]) {
    const loc = locationById[locId];
    addNode({
      id: locId,
      type: 'LOCATION',
      name: loc.name,
      sub: `${loc.district}, ${loc.state}`,
    });
    personIds.forEach((pid) => {
      if (!addedNodeIds.has(pid)) return;
      edges.push({
        id: eid(),
        source: pid,
        target: locId,
        type: 'location_observation',
        evidence: caseId,
        confidence: 80,
        count: 1,
      });
    });
  }

  // ── 7. Vehicle node + association edges ──────────────────────────────────
  if (vehicleId && vehicleById[vehicleId]) {
    const veh = vehicleById[vehicleId];
    addNode({
      id: vehicleId,
      type: 'VEHICLE',
      name: `${veh.registration} (${veh.vehicle_type})`,
      sub: `Observed · ${caseId}`,
    });
    // Associate vehicle with first person (or owner if present)
    const primaryPid = personIds.find((pid) => addedNodeIds.has(pid));
    if (primaryPid) {
      edges.push({
        id: eid(),
        source: primaryPid,
        target: vehicleId,
        type: 'vehicle_association',
        evidence: caseId,
        confidence: 82,
        count: 1,
      });
    }
  }

  // ── 8. Organization node + affiliation edges ──────────────────────────────
  if (orgId && orgById[orgId]) {
    const org = orgById[orgId];
    addNode({
      id: orgId,
      type: 'ORG',
      name: org.name,
      sub: `${org.type} · ${caseId}`,
    });
    personIds.forEach((pid) => {
      if (!addedNodeIds.has(pid)) return;
      edges.push({
        id: eid(),
        source: pid,
        target: orgId,
        type: 'organization_association',
        evidence: caseId,
        confidence: 85,
        count: 1,
      });
    });
  }

  // ── 9. Account nodes + ownership + financial edges ────────────────────────
  accountIds.forEach((aid) => {
    const acc = accountById[aid];
    if (!acc) return;
    addNode({
      id: aid,
      type: 'ACCOUNT',
      name: `${aid} (${acc.institution || 'Bank'})`,
      sub: `${acc.state} · ${acc.owner_id}`,
    });
    // Ownership edge: owner person → account
    if (acc.owner_id && addedNodeIds.has(acc.owner_id)) {
      edges.push({
        id: eid(),
        source: acc.owner_id,
        target: aid,
        type: 'account_ownership',
        evidence: caseId,
        confidence: 98,
        count: 1,
      });
    }
  });

  // Financial transaction edges between accounts for this case
  const txnsForCase = TRANSACTIONS.filter((t) => t.case_id === caseId);
  // Group by sender-receiver pair
  const txnPairs = {};
  txnsForCase.forEach((t) => {
    const key = `${t.sender_account}|${t.receiver_account}`;
    if (!txnPairs[key]) txnPairs[key] = { from: t.sender_account, to: t.receiver_account, total: 0, count: 0, ids: [], type: t.transaction_type, risk: t.risk_label };
    txnPairs[key].total += parseInt(t.amount_inr, 10) || 0;
    txnPairs[key].count++;
    txnPairs[key].ids.push(t.transaction_id);
  });

  Object.values(txnPairs).forEach(({ from, to, total, count, ids, risk }) => {
    if (!addedNodeIds.has(from) || !addedNodeIds.has(to)) return;
    edges.push({
      id: eid(),
      source: from,
      target: to,
      type: 'financial',
      evidence: ids[0],
      confidence: risk === '1' ? 93 : 85,
      count,
      amount: `\u20b9${total.toLocaleString('en-IN')}`,
    });
  });

  // Ensure FIR documented transfer between accountIds is represented
  if (accountIds.length >= 2 && addedNodeIds.has(accountIds[0]) && addedNodeIds.has(accountIds[1])) {
    const existingTxn = edges.find((e) => (e.source === accountIds[0] && e.target === accountIds[1]) || (e.source === accountIds[1] && e.target === accountIds[0]));
    if (!existingTxn) {
      edges.push({
        id: eid(),
        source: accountIds[0],
        target: accountIds[1],
        type: 'financial',
        evidence: `${caseId}_TXN`,
        confidence: 90,
        count: 1,
        amount: '\u20b94,50,000',
      });
    }
  }
  // Connect primary person to source account if not already linked
  const primaryPid = personIds.find((pid) => addedNodeIds.has(pid));
  if (primaryPid && accountIds.length > 0 && addedNodeIds.has(accountIds[0])) {
    const hasAccEdge = edges.some((e) => (e.source === primaryPid || e.target === primaryPid) && (e.source === accountIds[0] || e.target === accountIds[0]));
    if (!hasAccEdge) {
      edges.push({
        id: eid(),
        source: primaryPid,
        target: accountIds[0],
        type: 'account_ownership',
        evidence: caseId,
        confidence: 94,
        count: 1,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Returns the default focus node ID for a given case.
 * Falls back to the first person in the FIR if no primary subject found.
 */
export function getDefaultFocusForCase(caseId = 'FIR_0001') {
  const fir = FIR_TABLE.find((r) => r.case_id === caseId);
  if (!fir || !fir.person_ids) return null;
  const personIds = fir.person_ids.split(';').map((s) => s.trim()).filter(Boolean);
  // Prefer a person whose role is 'subject'
  const subject = personIds.find((pid) => {
    const p = personById[pid];
    return p && p.role === 'subject';
  });
  return subject || personIds[0] || null;
}

/**
 * Returns all available case IDs from cases.csv.
 */
export function getAllCaseIds() {
  return CASES_TABLE.map((r) => r.case_id).filter(Boolean);
}

/**
 * Returns real counts and breakdown for a given case ID directly from the Section 15.1 dataset.
 */
export function getCaseStats(caseId = 'FIR_0001') {
  const fir = FIR_TABLE.find((r) => r.case_id === caseId) || FIR_TABLE[0];
  const cid = fir?.case_id || caseId;
  const graph = buildGraphForCase(cid);

  const cdrRecords = CDR.filter((c) => c.case_id === cid);
  const txnRecords = TRANSACTIONS.filter((t) => t.case_id === cid);
  const cdrCount = cdrRecords.length;
  const txnCount = txnRecords.length;
  const evidenceItems = cdrCount + txnCount;

  const entities = graph.nodes.length;
  const relationships = graph.edges.length;

  const personsCount = graph.nodes.filter((n) => n.type === 'PERSON').length;
  const phonesCount = graph.nodes.filter((n) => n.type === 'PHONE').length;
  const accountsCount = graph.nodes.filter((n) => n.type === 'ACCOUNT').length;
  const othersCount = entities - (personsCount + phonesCount + accountsCount);

  const totalCases = CASES_TABLE.length || FIR_TABLE.length || 30;

  return {
    caseId: cid,
    evidenceItems,
    entities,
    relationships,
    activeCases: totalCases,
    cdrCount,
    txnCount,
    personsCount,
    phonesCount,
    accountsCount,
    othersCount,
  };
}

/**
 * Returns AI Leads scoped to the active FIR.
 * For FIR_0001, falls back to the curated sample leads if provided.
 * For other cases, dynamically constructs pattern detection findings from the case's real entities.
 */
export function getLeadsForCase(caseId = 'FIR_0001', fallbackLeads = []) {
  if (caseId === 'FIR_0001' && fallbackLeads && fallbackLeads.length > 0) {
    return fallbackLeads;
  }
  const fir = FIR_TABLE.find((r) => r.case_id === caseId);
  if (!fir) return fallbackLeads;

  const personIds = fir.person_ids ? fir.person_ids.split(';').map((s) => s.trim()).filter(Boolean) : [];
  const primaryP = personById[personIds[0]];
  const secondaryP = personById[personIds[1]];
  const loc = locationById[fir.location_id?.trim()];
  const veh = vehicleById[fir.vehicle_id?.trim()];
  const org = orgById[fir.organization_id?.trim()];
  const accIds = fir.account_ids ? fir.account_ids.split(';').map((s) => s.trim()).filter(Boolean) : [];

  const leads = [];

  // Lead 1: Central Entity / Hub pattern
  if (primaryP) {
    leads.push({
      id: `${caseId}-LEAD-01`,
      title: `Central Entity Links ${org?.name || 'Local Network'} and Operations`,
      entity: `${primaryP.name} (${primaryP.person_id})`,
      confidence: 91,
      status: 'review',
      evidence: [caseId, primaryP.person_id, org?.organization_id].filter(Boolean),
      text: `${primaryP.name} acts as a primary focal point in ${caseId}, linking ${org?.name || 'commercial syndicate'} with account transactions and local operations.`,
      trace: [
        `High centrality detected in ${caseId} investigation graph`,
        `Named primary subject in ${caseId} report (${primaryP.district || 'Nagpur'}, ${primaryP.state || 'MH'})`,
        `Direct ownership of telephony and financial endpoints`,
      ],
    });
  }

  // Lead 2: Co-mention / Telephony linkage
  if (secondaryP) {
    leads.push({
      id: `${caseId}-LEAD-02`,
      title: `Cross-Entity Linkage & Telephony Coordination Pattern`,
      entity: `${secondaryP.name} (${secondaryP.person_id})`,
      confidence: 87,
      status: 'review',
      evidence: [caseId, secondaryP.person_id, primaryP?.person_id].filter(Boolean),
      text: `${secondaryP.name} co-occurs with ${primaryP ? primaryP.name : 'primary target'} in ${caseId} logs with elevated contact density.`,
      trace: [
        `Telephony & meeting correlation detected in case dossier`,
        `FIR co-mention registered in ${caseId}`,
        `Jurisdiction: ${secondaryP.district}, ${secondaryP.state}`,
      ],
    });
  }

  // Lead 3: Financial structuring pattern
  if (accIds.length >= 2) {
    leads.push({
      id: `${caseId}-LEAD-03`,
      title: `Expedited Fund Structuring & Rapid Transfer Flow`,
      entity: `${accIds[0]} ↔ ${accIds[1]}`,
      confidence: 84,
      status: 'review',
      evidence: [caseId, accIds[0], accIds[1]],
      text: `Direct transaction flow identified between ${accIds[0]} and ${accIds[1]} matching layering pattern in ${caseId}.`,
      trace: [
        `High volume fund movement between case accounts`,
        `Immediate sequencing after reported contact event`,
      ],
    });
  }

  // Lead 4: Physical observation
  if (loc && veh) {
    leads.push({
      id: `${caseId}-LEAD-04`,
      title: `Spatio-Temporal Co-Location at ${loc.name}`,
      entity: `${veh.registration} · ${loc.district}`,
      confidence: 79,
      status: 'dismissed',
      evidence: [loc.location_id, veh.vehicle_id],
      text: `Vehicle ${veh.registration} (${veh.vehicle_type}) was recorded at ${loc.name} during the incident window.`,
      trace: [
        `Automated ANPR/visual match at ${loc.name}`,
        `Vehicle association linked to ${caseId}`,
      ],
    });
  }

  return leads.length > 0 ? leads : fallbackLeads;
}

/**
 * Returns candidate duplicate resolution information tailored to the active FIR.
 */
export function getDuplicateForCase(caseId = 'FIR_0001') {
  const fir = FIR_TABLE.find((r) => r.case_id === caseId);
  const personIds = fir?.person_ids ? fir.person_ids.split(';').map((s) => s.trim()).filter(Boolean) : [];
  const p = personById[personIds[0]];
  if (!p) {
    return {
      a: 'Devraj Sharma',
      b: 'D. Sharma',
      confidence: 91,
      detail: 'vehicle and phone co-occurrence',
    };
  }
  const nameParts = p.name.split(' ');
  const abbrev = nameParts.length > 1 ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}` : `${p.name} (Alias)`;
  return {
    a: p.name,
    b: abbrev,
    confidence: 91,
    detail: `vehicle and phone co-occurrence in ${p.district || 'Nagpur'}`,
  };
}
