import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { COMM_FREQ, TRANSACTIONS, T } from '../data/mockData';
import { MessageSquare, Wallet, Phone, ArrowRightLeft, TrendingUp } from 'lucide-react';

const COMM_PAIRS = [
  { pair: "Arjun Nair ↔ Meera Sen", record: "CDR-1042", calls: 14, trend: "Stable", last: "18 Aug 2026" },
  { pair: "Arjun Nair ↔ Kavita Rao", record: "CDR-1119", calls: 6, trend: "New", last: "19 Aug 2026" },
  { pair: "Devraj Sharma ↔ Sanjay Iyer", record: "CDR-1223", calls: 11, trend: "Increasing", last: "20 Aug 2026" },
];

export default function CommsFinancialView({ initialSubTab = "comms" }) {
  const [subTab, setSubTab] = useState(initialSubTab);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1080 }}>
      {/* Sub-tab Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>
            {subTab === "comms" ? "Telecommunications Intelligence (CDR)" : "Financial Transaction Flow Ledger"}
          </div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 3 }}>
            {subTab === "comms"
              ? "Call frequency surge analysis, tower activity, and communication partner trends"
              : "Rapid transaction layering detection, counterparties, and amount structuring"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, background: T.panel, border: `1px solid ${T.border}`, padding: 3, borderRadius: 8 }}>
          <button
            onClick={() => setSubTab("comms")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              background: subTab === "comms" ? T.panelAlt : "transparent",
              color: subTab === "comms" ? T.signal : T.textDim,
            }}
          >
            <MessageSquare size={14} /> Telecommunications
          </button>
          <button
            onClick={() => setSubTab("financial")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              background: subTab === "financial" ? T.panelAlt : "transparent",
              color: subTab === "financial" ? T.ok : T.textDim,
            }}
          >
            <Wallet size={14} /> Financial Flow
          </button>
        </div>
      </div>

      {subTab === "comms" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* CDR Call Frequency Chart */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
              Daily Call Frequency (Aug 12 - Aug 18)
            </div>
            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COMM_FREQ} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} />
                  <XAxis dataKey="day" stroke={T.textDim} fontSize={11.5} />
                  <YAxis stroke={T.textDim} fontSize={11.5} />
                  <Tooltip
                    contentStyle={{ background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}
                  />
                  <Bar dataKey="CDR-1042" fill="#5B8DEF" radius={[3, 3, 0, 0]} name="CDR-1042 (Nair ↔ Sen)" />
                  <Bar dataKey="CDR-1119" fill={T.signal} radius={[3, 3, 0, 0]} name="CDR-1119 (Nair ↔ Rao)" />
                  <Bar dataKey="CDR-1223" fill={T.violet} radius={[3, 3, 0, 0]} name="CDR-1223 (Sharma ↔ Iyer)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Communication Pairs Table */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
              High-Frequency Interacting Pairs
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.8fr 1fr", padding: "6px 0", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
                <span>COMMUNICATION PAIR</span>
                <span>RECORD ID</span>
                <span>CALLS</span>
                <span>TREND</span>
                <span>LAST CONTACT</span>
              </div>
              {COMM_PAIRS.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr 0.8fr 0.8fr 1fr",
                    padding: "10px 0",
                    fontSize: 12.5,
                    borderBottom: i < COMM_PAIRS.length - 1 ? `1px solid ${T.borderSoft}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{p.pair}</span>
                  <span style={{ fontFamily: "var(--mono)", color: T.signal, fontSize: 11.5 }}>{p.record}</span>
                  <span style={{ fontFamily: "var(--mono)" }}>{p.calls}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: p.trend === "Increasing" ? T.flag : p.trend === "New" ? T.signal : T.ok,
                  }}>
                    {p.trend}
                  </span>
                  <span style={{ color: T.textDim, fontSize: 12 }}>{p.last}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Financial Flow Line Chart */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>
              Transaction Velocity & Structuring Timeline (INR ₹)
            </div>
            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TRANSACTIONS} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} />
                  <XAxis dataKey="date" stroke={T.textDim} fontSize={11.5} />
                  <YAxis
                    stroke={T.textDim}
                    fontSize={11.5}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                    contentStyle={{ background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="amount" stroke={T.ok} strokeWidth={2.5} dot={{ r: 5, fill: T.ok }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transaction Ledger Table */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
              Reconciled Transaction Records
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.2fr 1fr 0.8fr", padding: "6px 0", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
                <span>TXN ID</span>
                <span>ORIGINATING ENTITY</span>
                <span>BENEFICIARY</span>
                <span>AMOUNT (INR)</span>
                <span>DATE</span>
              </div>
              {TRANSACTIONS.map((txn, i) => (
                <div
                  key={txn.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 1.2fr 1fr 0.8fr",
                    padding: "10px 0",
                    fontSize: 12.5,
                    borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${T.borderSoft}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: "var(--mono)", color: T.ok, fontSize: 11.5 }}>{txn.id}</span>
                  <span style={{ fontWeight: 500 }}>{txn.from}</span>
                  <span style={{ fontWeight: 500 }}>{txn.to}</span>
                  <span style={{ fontFamily: "var(--mono)", color: T.flag, fontWeight: 600 }}>₹{txn.amount.toLocaleString()}</span>
                  <span style={{ color: T.textDim }}>{txn.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
