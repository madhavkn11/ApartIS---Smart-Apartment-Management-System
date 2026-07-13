import { useEffect, useState } from "react"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function FlatLedger({ token, dark = false }) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)

  const s = getStyles(dark)

  useEffect(() => {
    generateAndFetch()
  }, [month, year])

  const generateAndFetch = async () => {
    setLoading(true)
    try {
      // First generate payment records if they don't exist
      await fetch("http://localhost:5000/payments/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ month, year })
      })

      // Then fetch all payments for this month
      const res = await fetch(`http://localhost:5000/payments?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPayments(data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const markPaid = async (id) => {
    try {
      await fetch(`http://localhost:5000/payments/${id}/pay`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      generateAndFetch()  // refresh
    } catch (err) {
      console.log(err)
    }
  }

  const markUnpaid = async (id) => {
    try {
      await fetch(`http://localhost:5000/payments/${id}/unpay`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      generateAndFetch()  // refresh
    } catch (err) {
      console.log(err)
    }
  }

  const totalCollected = payments.filter(p => p.status === "Paid").length * 3000
  const totalPending   = payments.filter(p => p.status === "Pending").length * 3000
  const defaulting     = payments.filter(p => p.status === "Pending").length

  return (
    <div>
      <h2 style={s.title}>Flat ledger</h2>

      {/* Month + Year selector */}
      <div style={s.filterRow}>
        <select
          value={month}
          onChange={e => setMonth(parseInt(e.target.value))}
          style={s.select}
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          style={s.select}
        >
          {[2024, 2025, 2026, 2027].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary cards */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Total flats</div>
          <div style={s.summaryValue}>{payments.length}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Collected</div>
          <div style={{ ...s.summaryValue, color: dark ? "#a8d878" : "#3B6D11" }}>₹{totalCollected.toLocaleString()}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Pending</div>
          <div style={{ ...s.summaryValue, color: dark ? "#f5c272" : "#854F0B" }}>₹{totalPending.toLocaleString()}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Defaulting flats</div>
          <div style={{ ...s.summaryValue, color: dark ? "#f0a3a3" : "#A32D2D" }}>{defaulting}</div>
        </div>
      </div>

      {/* Payments table */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "20px", color: s.muted }}>Loading...</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Flat No", "Month", "Year", "Amount", "Status", "Paid On", "Action"].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "16px", textAlign: "center", color: s.muted }}>
                  No records found
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p._id}>
                  <td style={s.td}>{p.flatNumber}</td>
                  <td style={s.td}>{MONTHS[p.month - 1]}</td>
                  <td style={s.td}>{p.year}</td>
                  <td style={s.td}>₹{p.amount.toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: p.status === "Paid" ? s.paidBg : s.pendingBg,
                      color: p.status === "Paid" ? s.paidText : s.pendingText
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {p.paidOn ? new Date(p.paidOn).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td style={s.td}>
                    {p.status === "Pending" ? (
                      <button onClick={() => markPaid(p._id)} style={s.payBtn}>
                        Mark paid
                      </button>
                    ) : (
                      <button onClick={() => markUnpaid(p._id)} style={s.unpayBtn}>
                        Undo
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

function getStyles(dark) {
  const text = {
    primary: dark ? "#f0efe9" : "#1a1a18",
    secondary: dark ? "#b8b6ae" : "#555",
    muted: dark ? "#8a887f" : "#888",
  }
  const surface = dark ? "#1c2333" : "#fff"
  const border = dark ? "#2c3344" : "#e0e0e0"
  const rowBorder = dark ? "#262d40" : "#f0f0f0"
  const inputBg = dark ? "#222a3c" : "#fff"
  const inputBorder = dark ? "#384058" : "#ccc"
  const navy = "#13284a"

  return {
    muted: text.muted,
    title:        { fontSize: "18px", fontWeight: "500", marginBottom: "16px", color: text.primary },
    filterRow:    { display: "flex", gap: "10px", marginBottom: "16px" },
    select:       { padding: "8px 12px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", cursor: "pointer", background: inputBg, color: text.primary },
    summaryRow:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" },
    summaryCard:  { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px" },
    summaryLabel: { fontSize: "12px", color: text.muted, marginBottom: "8px", textTransform: "uppercase" },
    summaryValue: { fontSize: "22px", fontWeight: "500", color: text.primary },
    table:        { width: "100%", borderCollapse: "collapse", background: surface, borderRadius: "10px", overflow: "hidden" },
    th:           { background: navy, color: "#fff", padding: "10px 12px", textAlign: "left", fontSize: "13px" },
    td:           { padding: "10px 12px", borderBottom: `1px solid ${rowBorder}`, fontSize: "13px", color: text.primary },
    badge:        { padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" },
    paidBg:       dark ? "#1f3a23" : "#EAF3DE",
    paidText:     dark ? "#a8d878" : "#3B6D11",
    pendingBg:    dark ? "#3a2a1f" : "#FAECE7",
    pendingText:  dark ? "#f0a36b" : "#993C1D",
    payBtn:       { padding: "4px 12px", fontSize: "12px", border: `1px solid ${dark ? "#2f5c3a" : "#9FE1CB"}`, borderRadius: "4px", cursor: "pointer", background: dark ? "#1f3a23" : "#EAF3DE", color: dark ? "#a8d878" : "#3B6D11" },
    unpayBtn:     { padding: "4px 12px", fontSize: "12px", border: `1px solid ${inputBorder}`, borderRadius: "4px", cursor: "pointer", background: "transparent", color: text.secondary },
  }
}