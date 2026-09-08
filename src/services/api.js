// API service for NexusIntel frontend with transparent fallback to client data
const API_BASE = '/api/v1';

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Offline mode
  }
  return null;
}

export async function fetchCases() {
  try {
    const res = await fetch(`${API_BASE}/cases`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchCaseSummary(caseId) {
  try {
    const res = await fetch(`${API_BASE}/cases/${caseId}/summary`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchGraphSubgraph(caseId, centerId, hops = 2) {
  try {
    let url = `${API_BASE}/graph/subgraph?hops=${hops}`;
    if (caseId) url += `&case_id=${encodeURIComponent(caseId)}`;
    if (centerId) url += `&center_id=${encodeURIComponent(centerId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchShortestPath(sourceId, targetId, caseId) {
  try {
    let url = `${API_BASE}/graph/shortest-path?source_id=${encodeURIComponent(sourceId)}&target_id=${encodeURIComponent(targetId)}`;
    if (caseId) url += `&case_id=${encodeURIComponent(caseId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchCaseAnalytics(caseId) {
  try {
    const res = await fetch(`${API_BASE}/graph/analytics/${encodeURIComponent(caseId)}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function searchHybrid(query, role, actor) {
  try {
    const res = await fetch(`${API_BASE}/search/hybrid?q=${encodeURIComponent(query)}&role=${encodeURIComponent(role)}&actor=${encodeURIComponent(actor)}`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchAlerts(caseId) {
  try {
    const url = caseId ? `${API_BASE}/alerts?case_id=${caseId}` : `${API_BASE}/alerts`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function updateAlertStatus(alertId, status, notes, actor, role) {
  try {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes, actor, role }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchDuplicates() {
  try {
    const res = await fetch(`${API_BASE}/review/duplicates`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function resolveDuplicate(matchId, decision, justification, actor, role) {
  try {
    const res = await fetch(`${API_BASE}/review/duplicates/${matchId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, justification, actor, role }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function fetchAuditLogs(role, action, search) {
  try {
    let url = `${API_BASE}/audit?limit=50`;
    if (role && role !== 'all') url += `&role=${encodeURIComponent(role)}`;
    if (action && action !== 'all') url += `&action=${encodeURIComponent(action)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

export async function extractDocumentNER(text, documentTitle, actor, role) {
  try {
    const res = await fetch(`${API_BASE}/review/ner-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, document_title: documentTitle, actor, role }),
    });
    if (res.ok) return await res.json();
  } catch (e) {}
  return null;
}

/**
 * Upload a PDF file for text extraction only.
 * @param {File} file - the PDF File object
 * @param {boolean} forceOcr - if true, skip pypdf and use PaddleOCR directly
 * @param {string} actor
 * @param {string} role
 */
export async function uploadPDFForExtraction(file, forceOcr = false, actor = 'R. Basu', role = 'Investigating Officer') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('force_ocr', forceOcr ? 'true' : 'false');
    formData.append('actor', actor);
    formData.append('role', role);
    const res = await fetch(`${API_BASE}/ingest/pdf`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    return { error: err.detail || 'Upload failed' };
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Upload a PDF file for text extraction + NER pipeline.
 * @param {File} file - the PDF File object
 * @param {boolean} forceOcr - if true, skip pypdf and use PaddleOCR directly
 * @param {string} actor
 * @param {string} role
 */
export async function uploadPDFWithNER(file, forceOcr = false, actor = 'R. Basu', role = 'Investigating Officer') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('force_ocr', forceOcr ? 'true' : 'false');
    formData.append('actor', actor);
    formData.append('role', role);
    const res = await fetch(`${API_BASE}/ingest/pdf/ner-extract`, {
      method: 'POST',
      body: formData,
    });
    if (res.ok) return await res.json();
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    return { error: err.detail || 'Upload failed' };
  } catch (e) {
    return { error: e.message };
  }
}
