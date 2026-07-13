import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import FlatLedger from "./FlatLedger";
import Complaints from "./Complaints";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [flats, setFlats] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [form, setForm] = useState({
    flatNumber: "", floor: "", type: "", ownerName: "", phone: ""
  });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  // ─── Notification state ─────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifPulse, setNotifPulse] = useState(false);
  const socketRef = useRef(null);
  const notifPanelRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const dark = theme === "dark";

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchFlats();
    fetchComplaints();
    fetchNotifications();

    // ─── Socket.io connection ───────────────────────────
    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("join-admins");
    });

    socket.on("new-complaint", (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setNotifPulse(true);
      setTimeout(() => setNotifPulse(false), 2000);
      // Refresh complaints list too
      fetchComplaints();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("http://localhost:5000/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("http://localhost:5000/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.log(err);
    }
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`http://localhost:5000/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.log(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchFlats = async () => {
    try {
      const res = await fetch("http://localhost:5000/flats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setFlats(data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch("http://localhost:5000/complaints", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setComplaints(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleEdit = (flat) => {
    setSelectedFlat(flat);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/flats/${selectedFlat._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedFlat)
      });
      if (res.ok) {
        setShowModal(false);
        setSelectedFlat(null);
        fetchFlats();
      } else {
        alert("Could not update flat");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const validate = () => {
    if (!/^[A-Z0-9]+$/.test(form.flatNumber.toUpperCase())) {
      alert("Flat number can only have letters and numbers. Example: 10A, 201");
      return false;
    }
    if (form.floor < 1 || form.floor > 50) {
      alert("Floor must be between 1 and 50");
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.phone)) {
      alert("Phone must be exactly 10 digits");
      return false;
    }
    return true;
  };

  const handleAddFlat = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const res = await fetch("http://localhost:5000/flats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form, maintenance: 3000 })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Flat added!");
        setForm({ flatNumber: "", floor: "", type: "", ownerName: "", phone: "" });
        fetchFlats();
      } else {
        alert(data.error || "Could not add flat");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/flats/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFlats();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("flatNumber");
    navigate("/");
  };

  const oneBHK = flats.filter(f => f.type === "1BHK").length;
  const twoBHK = flats.filter(f => f.type === "2BHK").length;
  const threeBHK = flats.filter(f => f.type === "3BHK").length;

  const openCount = complaints.filter(c => c.status === "Open").length;
  const inProgressCount = complaints.filter(c => c.status === "In Progress").length;
  const resolvedCount = complaints.filter(c => c.status === "Resolved").length;

  const s = getStyles(dark);

  return (
    <div style={s.page}>

      {/* ─── Notification Pulse Animation ─────────────────── */}
      <style>{`
        @keyframes notifPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Edit Modal */}
      {showModal && selectedFlat && (
        <div style={s.modalOverlay}>
          <div style={s.modalBox}>
            <h3 style={{ marginBottom: "16px", fontSize: "16px", color: s.text.primary }}>Edit flat</h3>
            <label style={s.label}>Flat number</label>
            <input style={s.modalInput} value={selectedFlat.flatNumber} onChange={e => setSelectedFlat({ ...selectedFlat, flatNumber: e.target.value })} />
            <label style={s.label}>Floor</label>
            <input style={s.modalInput} type="number" value={selectedFlat.floor} onChange={e => setSelectedFlat({ ...selectedFlat, floor: e.target.value })} />
            <label style={s.label}>Type</label>
            <select style={s.modalInput} value={selectedFlat.type} onChange={e => setSelectedFlat({ ...selectedFlat, type: e.target.value })}>
              <option>1BHK</option>
              <option>2BHK</option>
              <option>3BHK</option>
            </select>
            <label style={s.label}>Owner name</label>
            <input style={s.modalInput} value={selectedFlat.ownerName} onChange={e => setSelectedFlat({ ...selectedFlat, ownerName: e.target.value })} />
            <label style={s.label}>Phone</label>
            <input style={s.modalInput} value={selectedFlat.phone} onChange={e => setSelectedFlat({ ...selectedFlat, phone: e.target.value })} />
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button onClick={handleUpdate} style={s.saveBtn}>Save</button>
              <button onClick={() => { setShowModal(false); setSelectedFlat(null); }} style={s.cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div style={s.brand}>Apart<span style={{ color: "#e8a33d" }}>IS</span></div>

          {/* ─── Notification Bell ──────────────────────────── */}
          <div style={{ position: "relative" }} ref={notifPanelRef}>
            <button
              onClick={() => setShowNotifPanel(!showNotifPanel)}
              style={s.bellBtn}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  ...s.bellBadge,
                  animation: notifPulse ? "notifPulse 0.5s ease-in-out 3" : "none"
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* ─── Notification Dropdown Panel ──────────────── */}
            {showNotifPanel && (
              <div style={s.notifPanel}>
                <div style={s.notifHeader}>
                  <span style={s.notifTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={s.markAllBtn}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={s.notifList}>
                  {notifications.length === 0 ? (
                    <div style={s.notifEmpty}>No notifications yet</div>
                  ) : (
                    notifications.slice(0, 15).map((n, i) => (
                      <div
                        key={n._id || i}
                        onClick={() => {
                          if (!n.read) markOneRead(n._id);
                          setActiveTab("complaints");
                          setShowNotifPanel(false);
                        }}
                        style={{
                          ...s.notifItem,
                          background: n.read ? "transparent" : (dark ? "rgba(232,163,61,0.08)" : "rgba(232,163,61,0.06)"),
                          animation: "notifSlideIn 0.3s ease-out",
                          cursor: "pointer"
                        }}
                      >
                        <div style={s.notifDot(n.read)} />
                        <div style={{ flex: 1 }}>
                          <div style={s.notifMsg}>{n.message}</div>
                          <div style={s.notifTime}>
                            {n.createdAt ? timeAgo(n.createdAt) : "just now"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={s.navTabs}>
          {[
            { key: "dashboard", label: "Dashboard", icon: "📊" },
            { key: "flats", label: "Flats", icon: "🏢" },
            { key: "ledger", label: "Flat ledger", icon: "🧾" },
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

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div style={s.hero}>
              <div style={s.heroOverlay} />
              <div style={s.heroContent}>
                <span style={s.heroEyebrow}>Welcome back</span>
                <h1 style={s.heroTitle}>ApartIS Admin</h1>
                <p style={s.heroSubtitle}>{flats.length} flats · Managed by ApartIS</p>
              </div>
            </div>

            <h2 style={s.sectionTitle}>Dashboard</h2>
            <div style={s.statsGrid}>
              <StatCard s={s} label="Total flats" value={flats.length} />
              <StatCard s={s} label="Monthly maintenance" value="₹3,000" color="green" />
              <StatCard s={s} label="Total overdue" value="₹62,000" color="red" />
              <StatCard s={s} label="Defaulting flats" value="11" color="red" />
            </div>

            <h3 style={s.subTitle}>Flat directory</h3>
            <div style={s.statsGrid}>
              <StatCard s={s} label="1BHK flats" value={oneBHK} />
              <StatCard s={s} label="2BHK flats" value={twoBHK} />
              <StatCard s={s} label="3BHK flats" value={threeBHK} />
            </div>

            <h3 style={s.subTitle}>Complaints</h3>
            <div style={s.statsGrid}>
              <StatCard s={s} label="Open" value={openCount} color="red" />
              <StatCard s={s} label="In progress" value={inProgressCount} color="amber" />
              <StatCard s={s} label="Resolved" value={resolvedCount} color="green" />
            </div>
          </div>
        )}

        {/* Flats Tab */}
        {activeTab === "flats" && (
          <div>
            <h2 style={s.sectionTitle}>Flat directory</h2>
            <form onSubmit={handleAddFlat} style={s.addForm}>
              <input placeholder="Flat no (eg. 10A)" value={form.flatNumber} onChange={e => setForm({ ...form, flatNumber: e.target.value })} maxLength={5} required style={s.input} />
              <input placeholder="Floor" type="number" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} min={1} max={50} required style={s.input} />
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required style={s.input}>
                <option value="">Type</option>
                <option>1BHK</option>
                <option>2BHK</option>
                <option>3BHK</option>
              </select>
              <input placeholder="Owner name" value={form.ownerName} onChange={e => setForm({ ...form, ownerName: e.target.value })} maxLength={50} required style={s.input} />
              <input
                placeholder="Phone (10 digits)"
                value={form.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, phone: val });
                }}
                maxLength={10}
                required
                style={s.input}
              />
              <button type="submit" style={s.addBtn}>+ Add flat</button>
            </form>

            <table style={s.table}>
              <thead>
                <tr>
                  {["Flat", "Floor", "Type", "Owner", "Phone", "Maintenance", "Action"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flats.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "16px", textAlign: "center", color: s.text.muted }}>
                      No flats added yet
                    </td>
                  </tr>
                ) : (
                  flats.map(f => (
                    <tr key={f._id}>
                      <td style={s.td}>{f.flatNumber}</td>
                      <td style={s.td}>{f.floor}</td>
                      <td style={s.td}><span style={s.badge}>{f.type}</span></td>
                      <td style={s.td}>{f.ownerName}</td>
                      <td style={s.td}>{f.phone}</td>
                      <td style={s.td}>₹3,000</td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(f._id)} style={s.deleteBtn}>Delete</button>
                        <button onClick={() => handleEdit(f)} style={s.editBtn}>Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Flat Ledger Tab */}
        {activeTab === "ledger" && (
          <FlatLedger token={token} dark={dark} />
        )}

        {/* Complaints Tab */}
        {activeTab === "complaints" && (
          <Complaints token={token} dark={dark} />
        )}

      </div>
    </div>
  );
}

// ─── Helper: relative time ────────────────────────────────────
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatCard({ s, label, value, color }) {
  const colorMap = {
    red: s.isDark ? "#f0a3a3" : "#A32D2D",
    green: s.isDark ? "#a8d878" : "#3B6D11",
    amber: s.isDark ? "#f5c272" : "#854F0B",
  };
  return (
    <div style={s.statCard}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: colorMap[color] || s.text.primary }}>{value}</div>
    </div>
  );
}

function getStyles(dark) {
  const text = {
    primary: dark ? "#f0efe9" : "#1a1a18",
    secondary: dark ? "#b8b6ae" : "#555",
    muted: dark ? "#8a887f" : "#888",
  };
  const surface = dark ? "#1c2333" : "#fff";
  const page = dark ? "#11151f" : "#f7f6f2";
  const border = dark ? "#2c3344" : "#e8e6df";
  const inputBg = dark ? "#222a3c" : "#fff";
  const inputBorder = dark ? "#384058" : "#ccc";
  const navy = "#13284a";

  return {
    isDark: dark,
    text,
    page: { display: "flex", width: "100%", minHeight: "100vh", background: page },
    sidebar: { width: "220px", background: navy, padding: "24px 14px", display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 },
    brand: { color: "#fff", fontSize: "22px", fontWeight: "500", paddingLeft: "8px" },
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
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" },
    statCard: { background: surface, border: `0.5px solid ${border}`, borderRadius: "10px", padding: "16px" },
    statLabel: { fontSize: "12px", color: text.muted, marginBottom: "8px", textTransform: "uppercase" },
    statValue: { fontSize: "22px", fontWeight: "500" },

    addForm: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", background: surface, padding: "16px", borderRadius: "10px", border: `0.5px solid ${border}` },
    input: { padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", flex: "1", minWidth: "120px", background: inputBg, color: text.primary },
    addBtn: { padding: "8px 16px", background: navy, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },

    table: { width: "100%", borderCollapse: "collapse", background: surface, borderRadius: "10px", overflow: "hidden" },
    th: { background: navy, color: "#fff", padding: "10px 12px", textAlign: "left", fontSize: "13px" },
    td: { padding: "10px 12px", borderBottom: `1px solid ${border}`, fontSize: "13px", color: text.primary },
    badge: { background: dark ? "#1f3a5c" : "#E6F1FB", color: dark ? "#9cc4ed" : "#0C447C", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" },
    deleteBtn: { padding: "4px 12px", fontSize: "12px", border: `1px solid ${dark ? "#5c2e2e" : "#f09595"}`, borderRadius: "4px", cursor: "pointer", background: "transparent", color: dark ? "#f0a3a3" : "#A32D2D" },
    editBtn: { padding: "4px 12px", fontSize: "12px", border: `1px solid ${dark ? "#3a4a6e" : navy}`, borderRadius: "4px", cursor: "pointer", background: "transparent", color: dark ? "#9cc4ed" : navy, marginLeft: "6px" },

    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalBox: { background: surface, borderRadius: "10px", padding: "24px", width: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" },
    modalInput: { padding: "8px 10px", fontSize: "13px", border: `1px solid ${inputBorder}`, borderRadius: "6px", marginBottom: "12px", width: "100%", background: inputBg, color: text.primary },
    label: { fontSize: "12px", color: text.secondary, marginBottom: "4px", display: "block" },
    saveBtn: { padding: "8px 20px", background: navy, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", flex: 1 },
    cancelBtn: { padding: "8px 20px", background: "transparent", color: text.primary, border: `1px solid ${inputBorder}`, borderRadius: "6px", cursor: "pointer", fontSize: "13px", flex: 1 },

    // ─── Notification Styles ────────────────────────────
    bellBtn: {
      position: "relative",
      background: "rgba(255,255,255,0.08)",
      border: "none",
      borderRadius: "8px",
      padding: "8px 10px",
      fontSize: "18px",
      cursor: "pointer",
      lineHeight: 1,
    },
    bellBadge: {
      position: "absolute",
      top: "-4px",
      right: "-4px",
      background: "#e53e3e",
      color: "#fff",
      fontSize: "10px",
      fontWeight: "700",
      borderRadius: "50%",
      width: "18px",
      height: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    },
    notifPanel: {
      position: "fixed",
      top: "24px",
      left: "230px",
      width: "320px",
      maxHeight: "420px",
      background: surface,
      border: `1px solid ${border}`,
      borderRadius: "10px",
      boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.15)",
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    notifHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 14px",
      borderBottom: `1px solid ${border}`,
    },
    notifTitle: {
      fontSize: "13px",
      fontWeight: "600",
      color: text.primary,
    },
    markAllBtn: {
      background: "none",
      border: "none",
      color: "#e8a33d",
      fontSize: "11px",
      fontWeight: "600",
      cursor: "pointer",
    },
    notifList: {
      overflowY: "auto",
      flex: 1,
    },
    notifEmpty: {
      padding: "24px",
      textAlign: "center",
      fontSize: "13px",
      color: text.muted,
    },
    notifItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "10px 14px",
      borderBottom: `1px solid ${border}`,
      transition: "background 0.15s",
    },
    notifDot: (read) => ({
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: read ? "transparent" : "#e8a33d",
      flexShrink: 0,
      marginTop: "5px",
    }),
    notifMsg: {
      fontSize: "12px",
      color: text.primary,
      lineHeight: "1.4",
    },
    notifTime: {
      fontSize: "11px",
      color: text.muted,
      marginTop: "2px",
    },
  };
}