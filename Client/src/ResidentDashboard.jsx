import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function ResidentDashboard() {
  const [activeTab, setActiveTab] = useState("home")
  const [flatInfo, setFlatInfo] = useState(null)
  const [payments, setPayments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [complaintForm, setComplaintForm] = useState({ title: "", description: "" })
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark")

  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const flatNumber = localStorage.getItem("flatNumber")
  const dark = theme === "dark"

  useEffect(() => {
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    if (!token || !flatNumber) { navigate("/"); return }
    fetchFlatInfo()
    fetchPayments()
    fetchComplaints()
  }, [])

  const fetchFlatInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5000/flats/byNumber/${flatNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setFlatInfo(data)
      }
    } catch (err) {
      console.log(err)
    }
  }

  const fetchPayments = async () => {
    try {
      const res = await fetch(`http://localhost:5000/payments/resident/${flatNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPayments(data)
      }
    } catch (err) {
      console.log(err)
    }
  }



  
  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/complaints", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setComplaints(data)
      }
    } catch (err) {
      console.log(err)
    }
  }

  const handleSubmitComplaint = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch("http://localhost:5000/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ flatNumber, ...complaintForm })
      })
      if (res.ok) {
        setComplaintForm({ title: "", description: "" })
        alert("Complaint submitted!")
        fetchComplaints()
      } else {
        const data = await res.json()
        alert(data.error || "Could not submit complaint")
      }
    } catch (err) {
      console.log(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("flatNumber")
    navigate("/")
  }

  const s = getStyles(dark)
  const paidCount = payments.filter(p => p.status === "Paid").length
  const pendingCount = payments.filter(p => p.status === "Pending").length
  const pendingAmount = pendingCount * 3000

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.brand}>Apart<span style={{ color: "#e8a33d" }}>IS</span></div>
        <div style={s.flatBadge}>Flat {flatNumber}</div>
        <div style={s.navTabs}>
          {[
            { key: "home", label: "Home", icon: "🏠" },
            { key: "payments", label: "Payments", icon: "💳" },
            { key: "complaints", label: "Complaints", icon: "📋" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...s.navTab,
                background: activeTab === tab.key ? s.navTabActiveBg : "transparent",
                color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.62)",
              }}
            >
              <span style={{ fontSize: "16px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => setTheme(dark ? "light" : "dark")} style={s.themeBtn}>
          {dark ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
        <button onClick={handleLogout} style={s.logoutBtn}>
          🚪 Log out
        </button>
      </div>

      {/* Content */}
      <div style={s.content}>

        {/* Home Tab */}
        {activeTab === "home" && (
          <div>
            <div style={s.hero}>
              <div style={s.heroOverlay} />
              <div style={s.heroContent}>
                <span style={s.heroEyebrow}>Welcome back, Resident</span>
                <h1 style={s.heroTitle}>Flat {flatNumber}</h1>
                <p style={s.heroSubtitle}>Your apartment at a glance</p>
              </div>
            </div>

            <h2 style={s.sectionTitle}>Flat Information</h2>
            {flatInfo ? (
              <div style={s.statsGrid}>
                <div style={s.statCard}>
                  <div style={s.statLabel}>FLAT NUMBER</div>
                  <div style={s.statValue}>{flatInfo.flatNumber}</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>FLOOR</div>
                  <div style={s.statValue}>{flatInfo.floor}</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>TYPE</div>
                  <div style={s.statValue}>{flatInfo.type}</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>OWNER</div>
                  <div style={s.statValue}>{flatInfo.ownerName}</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>MAINTENANCE</div>
                  <div style={{ ...s.statValue, color: dark ? "#a8d878" : "#3B6D11" }}>₹{flatInfo.maintenance?.toLocaleString()}</div>
                </div>
                <div style={s.statCard}>
                  <div style={s.statLabel}>PENDING DUES</div>
                  <div style={{ ...s.statValue, color: pendingAmount > 0 ? (dark ? "#f0a3a3" : "#A32D2D") : (dark ? "#a8d878" : "#3B6D11") }}>₹{pendingAmount.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div style={s.emptyCard}>
                <p style={{ color: s.text.muted }}>Flat information not found. Please contact admin to add flat details for {flatNumber}.</p>
              </div>
            )}

            <h3 style={s.subTitle}>Quick Summary</h3>
            <div style={s.statsGrid}>
              <div style={s.statCard}>
                <div style={s.statLabel}>PAYMENTS MADE</div>
                <div style={{ ...s.statValue, color: dark ? "#a8d878" : "#3B6D11" }}>{paidCount}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>PAYMENTS PENDING</div>
                <div style={{ ...s.statValue, color: dark ? "#f0a3a3" : "#A32D2D" }}>{pendingCount}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>COMPLAINTS FILED</div>
                <div style={s.statValue}>{complaints.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div>
            <h2 style={s.sectionTitle}>Payment History</h2>
            <div style={s.statsGrid}>
              <div style={s.statCard}>
                <div style={s.statLabel}>TOTAL PAID</div>
                <div style={{ ...s.statValue, color: dark ? "#a8d878" : "#3B6D11" }}>₹{(paidCount * 3000).toLocaleString()}</div>
              </div>
              <div style={s.statCard}>
                <div style={s.statLabel}>PENDING</div>
                <div style={{ ...s.statValue, color: dark ? "#f0a3a3" : "#A32D2D" }}>₹{pendingAmount.toLocaleString()}</div>
              </div>
            </div>

            <table style={s.table}>
              <thead>
                <tr>
                  {["Month", "Year", "Amount", "Status", "Paid On"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "16px", textAlign: "center", color: s.text.muted }}>
                      No payment records found
                    </td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p._id}>
                      <td style={s.td}>{MONTHS[p.month - 1]}</td>
                      <td style={s.td}>{p.year}</td>
                      <td style={s.td}>₹{p.amount.toLocaleString()}</td>
                      <td style={s.td}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500",
                          background: p.status === "Paid" ? (dark ? "#1f3a23" : "#EAF3DE") : (dark ? "#3a2a1f" : "#FAECE7"),
                          color: p.status === "Paid" ? (dark ? "#a8d878" : "#3B6D11") : (dark ? "#f0a36b" : "#993C1D")
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={s.td}>{p.paidOn ? new Date(p.paidOn).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === "complaints" && (
          <div>
            <h2 style={s.sectionTitle}>My Complaints</h2>

            <form onSubmit={handleSubmitComplaint} style={s.form}>
              <h3 style={s.formTitle}>Submit a new complaint</h3>
              <input
                placeholder="Title (eg. Water leakage)"
                value={complaintForm.title}
                onChange={e => setComplaintForm({ ...complaintForm, title: e.target.value })}
                maxLength={60}
                required
                style={s.input}
              />
              <textarea
                placeholder="Describe the issue in detail..."
                value={complaintForm.description}
                onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                maxLength={300}
                required
                rows={3}
                style={s.textarea}
              />
              <button type="submit" style={s.submitBtn}>Submit complaint</button>
            </form>

            <table style={s.table}>
              <thead>
                <tr>
                  {["Title", "Description", "Status", "Date"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: "16px", textAlign: "center", color: s.text.muted }}>
                      No complaints found
                    </td>
                  </tr>
                ) : (
                  complaints.map(c => (
                    <tr key={c._id}>
                      <td style={s.td}>{c.title}</td>
                      <td style={{ ...s.td, maxWidth: "250px", color: s.text.secondary }}>{c.description}</td>
                      <td style={s.td}>
                        <span style={{
                          padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "500",
                          background: c.status === "Resolved" ? (dark ? "#1f3a23" : "#EAF3DE") : c.status === "In Progress" ? (dark ? "#3a2e1c" : "#FEF3E2") : (dark ? "#3a2a1f" : "#FAECE7"),
                          color: c.status === "Resolved" ? (dark ? "#a8d878" : "#3B6D11") : c.status === "In Progress" ? (dark ? "#f5c272" : "#854F0B") : (dark ? "#f0a36b" : "#993C1D")
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={s.td}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
  const page = dark ? "#11151f" : "#f7f6f2"
  const border = dark ? "#2c3344" : "#e8e6df"
  const inputBg = dark ? "#222a3c" : "#fff"
  const inputBorder = dark ? "#384058" : "#ccc"
  const rowBorder = dark ? "#262d40" : "#f0f0f0"
  const navy = "#13284a"

  return {
    text,
    page: { display: "flex", width: "100%", minHeight: "100vh", background: page, fontFamily: "'Inter', sans-serif" },
    sidebar: { width: "220px", background: navy, padding: "24px 14px", display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 },
    brand: { color: "#fff", fontSize: "22px", fontWeight: "500", marginBottom: "8px", paddingLeft: "8px" },
    flatBadge: { color: "#e8a33d", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", paddingLeft: "8px", marginBottom: "20px", opacity: 0.85 },
    navTabs: { display: "flex", flexDirection: "column", gap: "2px" },
    navTab: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", fontSize: "15px", border: "none", cursor: "pointer", textAlign: "left", fontWeight: "500" },
    navTabActiveBg: "rgba(255,255,255,0.14)",
    themeBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "8px", fontSize: "14px", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", marginBottom: "4px" },
    logoutBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "12px 14px", borderRadius: "8px", fontSize: "14px", border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.5)" },
    content: { flex: 1, padding: "24px", minWidth: 0 },

    hero: { position: "relative", height: "170px", borderRadius: "12px", overflow: "hidden", marginBottom: "24px", background: `linear-gradient(135deg, ${navy} 0%, #1a3a6e 100%)` },
    heroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(19,40,74,0.15) 0%, rgba(19,40,74,0.92) 100%)" },
    heroContent: { position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "18px 24px" },
    heroEyebrow: { color: "rgba(255,255,255,0.65)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" },
    heroTitle: { color: "#fff", fontSize: "24px", fontWeight: 500, margin: 0 },
    heroSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: "13px", marginTop: "3px" },

    sectionTitle: { fontSize: "18px", fontWeight: "500", marginBottom: "16px", color: text.primary },
    subTitle: { fontSize: "14px", fontWeight: "500", margin: "24px 0 12px", color: text.secondary },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "16px" },
    statCard: { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px" },
    statLabel: { fontSize: "12px", color: text.muted, marginBottom: "8px", textTransform: "uppercase" },
    statValue: { fontSize: "22px", fontWeight: "500", color: text.primary },
    emptyCard: { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "24px", textAlign: "center" },

    table: { width: "100%", borderCollapse: "collapse", background: surface, borderRadius: "10px", overflow: "hidden", marginTop: "16px" },
    th: { background: navy, color: "#fff", padding: "10px 12px", textAlign: "left", fontSize: "13px" },
    td: { padding: "10px 12px", borderBottom: `1px solid ${rowBorder}`, fontSize: "13px", color: text.primary },

    form: { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" },
    formTitle: { fontSize: "14px", fontWeight: "500", marginBottom: "12px", color: text.primary },
    input: { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", marginBottom: "8px", background: inputBg, color: text.primary },
    textarea: { width: "100%", padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", marginBottom: "10px", resize: "vertical", fontFamily: "inherit", background: inputBg, color: text.primary },
    submitBtn: { padding: "8px 20px", background: navy, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  }
}
