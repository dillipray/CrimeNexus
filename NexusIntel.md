# NexusIntel — Criminal Network Analysis Dashboard

> **Context:** Built for **SIH 2026 Problem Statement #26189 — AI-Powered Criminal Network Analysis System**.  
> All names, phone numbers, transactions, and case data are **entirely fictional** — for demonstration only.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Design System (Tokens)](#design-system-tokens)
4. [Data Model](#data-model)
5. [Component Architecture](#component-architecture)
6. [Shared UI Primitives](#shared-ui-primitives)
7. [Navigation Structure](#navigation-structure)
8. [State Management](#state-management)
9. [Graph Algorithms](#graph-algorithms)
10. [Running the Component](#running-the-component)

---

## Overview

`NexusIntel.jsx` is a **single-file, self-contained React application** (~1,470 lines) that simulates a professional law-enforcement intelligence workbench. It gives investigators a unified interface to:

- Visualise entity **relationship networks** as an interactive SVG graph
- Reconstruct a **chronological investigation timeline**
- Review **AI-generated investigation leads** with full reasoning traces
- Analyse **communication (CDR)** and **financial transaction** patterns with charts
- **Search globally** across entities, evidence records, and timeline events
- Resolve **duplicate / ambiguous entity matches** before merging
- Compute real **network-centrality metrics** (degree, betweenness, closeness)
- Generate a structured **investigation report**

All data is hard-coded synthetic demo data. No backend or external API is required.

---

## Tech Stack & Dependencies

| Package | Usage |
|---|---|
| `react` | UI framework (`useState`, `useMemo`) |
| `lucide-react` | Icon library (sidebar, badges, buttons) |
| `recharts` | Bar chart (CDR frequency) and Line chart (transactions) |
| Google Fonts | `Space Grotesk` (headings), `Inter` (body), `IBM Plex Mono` (monospace) |

> The file is JSX and must be consumed inside a Vite or CRA project that resolves the packages above.

---

## Design System (Tokens)

All colours live in a single token object `T` at the top of the file. Edit it to retheme the entire app.

```js
const T = {
  bg:         "#0E161F",  // darkest background
  panel:      "#141F2B",  // card / panel surface
  panelAlt:   "#1A2733",  // hover / input surface
  raised:     "#1E2C39",  // elevated surface (dropdowns)
  border:     "#28394A",
  borderSoft: "#1F2E3C",
  text:       "#E6EDF4",
  textDim:    "#93A6B8",
  textFaint:  "#5D7086",
  signal:     "#3FC1C9",  // teal — active states / links
  flag:       "#E8A33D",  // amber — warnings / pending
  danger:     "#E0645A",  // red
  ok:         "#7FB77E",  // green — confirmed / reviewed
  violet:     "#B98CCE",  // purple — vehicle associations
};
```

Two supplementary maps extend the tokens:

- **`ENTITY_STYLE`** — maps each entity type to colour, dim colour, Lucide icon, and display label.
- **`REL_STYLE`** — maps each relationship type to its colour and display label.

---

## Data Model

All demo data is declared as module-level constants.

### Entities (`ENTITIES`)

12 total — 5 persons, 3 phones, 1 vehicle, 2 locations, 1 organisation.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | System ID e.g. `ENT-101` |
| `type` | `PERSON \| PHONE \| VEHICLE \| LOCATION \| ORG` | Entity category |
| `name` | `string` | Display name |
| `x`, `y` | `number` | Fixed SVG coordinates for the graph |
| `sub` | `string` | Subtitle shown in the entity side panel |

### Relationships (`RELATIONSHIPS`)

13 edges covering all 5 relationship types.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | `R1`…`R13` |
| `a`, `b` | `string` | Keys into `ENTITIES` |
| `type` | `string` | Relationship category |
| `evidence` | `string` | Source record ID e.g. `CDR-1042` |
| `confidence` | `number` | 0–100 |
| `count` | `number` | Observed interactions |
| `first`, `last` | `string` | Observation date range |
| `amount?` | `string` | Financial amount (optional) |

### Timeline Events (`TIMELINE`)

10 events (05 Aug – 20 Aug) with `time`, `type`, `title`, `detail`, `evidence`.

### Communication Records (`COMM_FREQ`)

7 daily data points (12–18 Aug) per CDR record — used by the bar chart.

### Transactions (`TRANSACTIONS`)

5 financial records with `id`, `from`, `to`, `amount` (INR number), `date`.

### AI Leads (`LEADS_INIT`)

4 investigation leads. Each has:

| Field | Description |
|---|---|
| `id` | `LEAD-XX` identifier |
| `title` | Short pattern description |
| `entity` | Primary entity involved |
| `confidence` | 0–100 score |
| `status` | `"review" \| "reviewed" \| "dismissed"` |
| `evidence` | Array of source record IDs |
| `text` | Human-readable explanation |
| `trace` | Step-by-step reasoning (expandable) |

### Entity Resolution Queue (`RESOLUTION_QUEUE`)

3 candidate duplicate pairs with `id`, `a`, `b`, `confidence`, `status` (`"pending" \| "merged" \| "rejected"`), `reasons[]`, `aAttrs`, `bAttrs`.

---

## Component Architecture

```
NexusIntel (root)
├── TopBar  ── logo · case badge · quick search · user badge
├── LeftNav ── two nav groups (Investigate / Tools)
└── Main content (active tab)
    ├── Dashboard
    ├── GraphView
    │   ├── SVG network (nodes + edges)
    │   ├── EntityPanel  (right — node selected)
    │   └── EdgePanel    (right — edge selected)
    ├── TimelineView
    ├── LeadsView
    ├── CommsView
    ├── FinancialView
    ├── SearchView
    ├── ResolutionView
    ├── AnalyticsView
    └── ReportsView
```

### `NexusIntel` (Root) — line 267

Default export. Owns all global state and wires views together.

### `Dashboard` — line 486

- 6-column KPI row (evidence, entities, relationships, AI leads, pending reviews, active cases)
- AI leads panel (pending-review leads only)
- Amber duplicate-entity alert banner with dismiss / review actions
- Static recent-activity log

### `GraphView` — line 588

SVG-based network graph with **fixed node positions** from `ENTITIES.x/y`.

- Edges rendered as `<line>` coloured by type; midpoint evidence label
- Nodes: two concentric circles + `<foreignObject>` Lucide icon; outer ring brightens on hover
- Relationship-type filter buttons above the graph
- Entity-type legend overlay (bottom-left)
- `EntityPanel` / `EdgePanel` slide in from the right when a node / edge is selected

#### `EntityPanel` — line 685
Entity name, ID, type, subtitle, clickable connected-entity list, evidence chips.

#### `EdgePanel` — line 733
Relationship type badge, source/target names, evidence chip, interaction count, date range, optional amount, confidence bar, "View source record" button.

### `TimelineView` — line 778

Vertical timeline with colour-coded dots per event type. Same relationship-type filter as the graph.

### `LeadsView` — line 826

Expandable lead cards with:
- ID, title, entity (clickable → graph), status badge
- Summary text, evidence chips, confidence bar
- **"Why am I seeing this?"** → expands `trace` steps
- Action buttons (review-state leads): Mark reviewed · Dismiss · Add note

### `CommsView` — line 913

1. Recharts `BarChart` — daily call frequency per CDR record
2. Communication-pairs table with trend badges (`Stable`, `Increasing`, `New`)

### `FinancialView` — line 964

1. Recharts `LineChart` — transaction amounts over time (INR, formatted as ₹)
2. Transaction ledger table (record, from, to, amount, date)

### `SearchView` — line 1012

Searches three datasets simultaneously:

| Dataset | Match field |
|---|---|
| Entities | Name substring |
| Evidence records | Evidence ID substring |
| Timeline events | Detail text / evidence ID |

Empty-query state shows entity-type summary tiles. Results include a short connection chain for each entity hit.

### `ResolutionView` — line 1154

Duplicate-entity review queue. Each card shows reasons, confidence bar, expandable side-by-side attribute comparison, and Confirm merge / Not a match buttons. **Merges never happen automatically.**

### `AnalyticsView` — line 1304

Real graph metrics via `computeGraphMetrics()`:

1. **Centrality table** — all entities ranked by betweenness, with degree and closeness columns. Rows are clickable → graph.
2. **Community structure** — simulates removing the highest-betweenness edge; shows resulting connected components and names the bridge entity.

### `ReportsView` — line 1379

On-demand report generation (900 ms simulated delay). Sections are tagged:

| Tag | Colour | Meaning |
|---|---|---|
| `OBSERVED` | Grey | Raw observed evidence |
| `AI` | Amber | AI-generated analysis |
| `REVIEW` | Teal | Investigator review / notes |

Includes a free-text investigator observations textarea and a disabled PDF export button.

---

## Shared UI Primitives

| Component | Description |
|---|---|
| `Badge` | Coloured pill label with border |
| `ConfidenceBar` | Thin progress bar (green ≥85%, amber ≥70%, grey otherwise) + numeric label |
| `KpiCard` | Metric card — label, large value, icon |
| `SectionLabel` | Small all-caps section heading |
| `EvidenceChip` | Monospace teal chip for evidence IDs |
| `ActionBtn` | Icon + label button (Leads & Resolution views) |
| `Row` | Label / value pair row (EdgePanel) |
| `SvgIcon` | Wraps a Lucide icon in `<foreignObject>` for SVG use |

---

## Navigation Structure

```
Investigate
  ├── Dashboard          (dashboard)
  ├── Network graph      (graph)
  ├── Timeline           (timeline)
  ├── AI leads           (leads)        ← badge: pending review count
  ├── Communication      (comms)
  └── Financial          (financial)

Tools
  ├── Global search      (search)
  ├── Entity resolution  (resolution)   ← badge: pending match count
  ├── Network analytics  (analytics)
  └── Reports            (reports)
```

Active tab: teal left border + bold text. Pending-count badges are hidden when zero.

---

## State Management

Pure React — `useState` + `useMemo` only. No Redux or Zustand. All state lives in the root `NexusIntel` component and flows down as props.

**Mutable state (persists within session):**
- `leads` — investigator can review or dismiss leads
- `resolutions` — investigator can confirm or reject entity merges

Everything else resets on page refresh (no localStorage).

---

## Graph Algorithms

`computeGraphMetrics(excludeEdgeId?)` runs three algorithms on the `ENTITIES` / `RELATIONSHIPS` graph. Passing an edge ID simulates its removal (used for community detection).

### Degree Centrality
Neighbour count from the adjacency list. O(V + E).

### Closeness Centrality
BFS from each node. `closeness = reachableCount / sumOfDistances`. O(V · (V + E)).

### Betweenness Centrality (Brandes' Algorithm)
For each source node:
1. Forward BFS — builds shortest-path counts (`sigma`) and predecessor lists.
2. Backward accumulation — propagates dependency scores (`delta`) back along the DAG.

Final scores halved for undirected graphs. Time complexity: **O(V · E)**.

### Community Detection
Re-run BFS after removing the highest-betweenness edge to find connected components. If the count increases, the removed edge was a bridge — revealing cluster structure.

---

## Running the Component

`NexusIntel.jsx` needs a Vite + React scaffold:

```bash
# 1. Scaffold (inside the SIH folder)
npx create-vite@latest . --template react

# 2. Install dependencies
npm install
npm install lucide-react recharts

# 3. Update src/App.jsx
```

```jsx
// src/App.jsx
import NexusIntel from "../NexusIntel.jsx";
export default function App() {
  return <NexusIntel />;
}
```

```bash
# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

> Google Fonts are loaded via `@import` inside a `<style>` tag — an internet connection is needed for correct typography.
