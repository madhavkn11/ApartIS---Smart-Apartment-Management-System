import { useEffect, useState } from "react"

export default function Complaints({ token, dark = false }) {
  const [complaints, setComplaints] = useState([])
  const [form, setForm] = useState({ flatNumber: "", title: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("All")

  const s = getStyles(dark)

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await fetch("http://localhost:5000/complaints", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setComplaints(data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch("http://localhost:5000/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        alert("Complaint submitted!")
        setForm({ flatNumber: "", title: "", description: "" })
        fetchComplaints()
      } else {
        alert(data.error || "Could not submit complaint")
      }
    } catch (err) {
      console.log(err)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/complaints/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      fetchComplaints()
    } catch (err) {
      console.log(err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/complaints/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchComplaints()
    } catch (err) {
      console.log(err)
    }
  }

  // Filter complaints by status
  const filtered = filter === "All"
    ? complaints
    : complaints.filter(c => c.status === filter)

  // Summary counts
  const openCount       = complaints.filter(c => c.status === "Open").length
  const inProgressCount = complaints.filter(c => c.status === "In Progress").length
  const resolvedCount   = complaints.filter(c => c.status === "Resolved").length

  return (
    <div>
      <h2 style={s.title}>Complaints</h2>

      {/* Submit complaint form */}
      <form onSubmit={handleSubmit} style={s.form}>
        <h3 style={s.formTitle}>Submit a complaint</h3>
        <div style={s.formRow}>
          <input
            placeholder="Flat number (eg. 501)"
            value={form.flatNumber}
            onChange={e => setForm({ ...form, flatNumber: e.target.value })}
            maxLength={5}
            required
            style={s.input}
          />
          <input
            placeholder="Title (eg. Water leakage)"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            maxLength={60}
            required
            style={{ ...s.input, flex: 2 }}
          />
        </div>
        <textarea
          placeholder="Describe the issue in detail..."
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          maxLength={300}
          required
          rows={3}
          style={s.textarea}
        />
        <button type="submit" style={s.submitBtn}>Submit complaint</button>
      </form>

      {/* Summary cards */}
      <div style={s.summaryRow}>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Total</div>
          <div style={s.summaryValue}>{complaints.length}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Open</div>
          <div style={{ ...s.summaryValue, color: dark ? "#f0a3a3" : "#A32D2D" }}>{openCount}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>In progress</div>
          <div style={{ ...s.summaryValue, color: dark ? "#f5c272" : "#854F0B" }}>{inProgressCount}</div>
        </div>
        <div style={s.summaryCard}>
          <div style={s.summaryLabel}>Resolved</div>
          <div style={{ ...s.summaryValue, color: dark ? "#a8d878" : "#3B6D11" }}>{resolvedCount}</div>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={s.filterRow}>
        {["All", "Open", "In Progress", "Resolved"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...s.filterBtn,
              background: filter === f ? "#13284a" : s.filterBtnBg,
              color: filter === f ? "#fff" : s.text.primary,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Complaints table */}
      {loading ? (
        <p style={{ textAlign: "center", padding: "20px", color: s.text.muted }}>Loading...</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              {["Flat No", "Title", "Description", "Status", "Date", "Update status", "Action"].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: "16px", textAlign: "center", color: s.text.muted }}>
                  No complaints found
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c._id}>
                  <td style={s.td}>{c.flatNumber}</td>
                  <td style={s.td}>{c.title}</td>
                  <td style={{ ...s.td, maxWidth: "200px", color: s.text.secondary }}>{c.description}</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: c.status === "Resolved" ? s.resolvedBg : c.status === "In Progress" ? s.progressBg : s.openBg,
                      color: c.status === "Resolved" ? s.resolvedText : c.status === "In Progress" ? s.progressText : s.openText
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={s.td}>
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td style={s.td}>
                    <select
                      value={c.status}
                      onChange={e => handleStatusChange(c._id, e.target.value)}
                      style={s.statusSelect}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </td>
                  <td style={s.td}>
                    <button onClick={() => handleDelete(c._id)} style={s.deleteBtn}>
                      Delete
                    </button>
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
    text,
    filterBtnBg: surface,
    title:        { fontSize: "18px", fontWeight: "500", marginBottom: "16px", color: text.primary },
    form:         { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" },
    formTitle:    { fontSize: "14px", fontWeight: "500", marginBottom: "12px", color: text.primary },
    formRow:      { display: "flex", gap: "8px", marginBottom: "8px" },
    input:        { padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", flex: 1, background: inputBg, color: text.primary },
    textarea:     { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", marginBottom: "10px", resize: "vertical", fontFamily: "inherit", background: inputBg, color: text.primary },
    submitBtn:    { padding: "8px 20px", background: navy, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
    summaryRow:   { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginBottom: "16px" },
    summaryCard:  { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px" },
    summaryLabel: { fontSize: "12px", color: text.muted, marginBottom: "8px", textTransform: "uppercase" },
    summaryValue: { fontSize: "22px", fontWeight: "500", color: text.primary },
    filterRow:    { display: "flex", gap: "8px", marginBottom: "16px" },
    filterBtn:    { padding: "6px 16px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "20px", cursor: "pointer" },
    table:        { width: "100%", borderCollapse: "collapse", background: surface, borderRadius: "10px", overflow: "hidden" },
    th:           { background: navy, color: "#fff", padding: "10px 12px", textAlign: "left", fontSize: "13px" },
    td:           { padding: "10px 12px", borderBottom: `1px solid ${rowBorder}`, fontSize: "13px", color: text.primary },
    badge:        { padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500" },
    resolvedBg:   dark ? "#1f3a23" : "#EAF3DE",
    resolvedText: dark ? "#a8d878" : "#3B6D11",
    progressBg:   dark ? "#3a2e1c" : "#FEF3E2",
    progressText: dark ? "#f5c272" : "#854F0B",
    openBg:       dark ? "#3a2a1f" : "#FAECE7",
    openText:     dark ? "#f0a36b" : "#993C1D",
    statusSelect: { padding: "4px 8px", fontSize: "12px", border: `1px solid ${inputBorder}`, borderRadius: "4px", cursor: "pointer", background: inputBg, color: text.primary },
    deleteBtn:    { padding: "4px 12px", fontSize: "12px", border: `1px solid ${dark ? "#5c2e2e" : "#f09595"}`, borderRadius: "4px", cursor: "pointer", background: "transparent", color: dark ? "#f0a3a3" : "#A32D2D" },
  }
}