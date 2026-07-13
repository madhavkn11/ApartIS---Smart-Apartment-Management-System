import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", role: "resident", flatNumber: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navigate = useNavigate();
  const dark = theme === "dark";
  const s = getStyles(dark);

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validate flat number if resident
    if (form.role === "resident" && !form.flatNumber.trim()) {
      setError("Flat number is required for residents.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: form.role,
          flatNumber: form.role === "resident" ? form.flatNumber.trim() : ""
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess("Account created successfully!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .ai-input::placeholder { color: ${s.placeholderColor}; }
        .ai-input:focus { outline: none; border-color: #C1622D !important; box-shadow: 0 0 0 3px rgba(193,98,45,0.18); }
        .ai-btn:hover { background: #A8521F !important; }
        .ai-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .ai-link:hover { text-decoration: underline; }
        .ai-eye:hover { opacity: 1 !important; }
        .ai-theme:hover { opacity: 1 !important; }
      `}</style>

      <div style={s.card}>
        <div style={s.toggleRow}>
          <button type="button" className="ai-theme" onClick={toggleTheme} style={s.themeToggle}>
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <h1 style={s.heading}>Create account</h1>
        <p style={s.subheading}>Join ApartIS Management System</p>

        {error && <p style={s.errorBox}>{error}</p>}
        {success && <p style={s.successBox}>{success}</p>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input
            className="ai-input"
            type="email"
            name="email"
            placeholder="you@apartis.com"
            value={form.email}
            onChange={handleChange}
            required
            style={s.input}
          />

          <label style={s.label}>Password</label>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              className="ai-input"
              type={showPw ? "text" : "password"}
              name="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              style={{ ...s.input, padding: "10px 44px 10px 12px", marginBottom: 0 }}
            />
            <button
              type="button"
              className="ai-eye"
              onClick={() => setShowPw(!showPw)}
              style={s.eyeBtn}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          <label style={s.label}>Role</label>
          <select
            className="ai-input"
            name="role"
            value={form.role}
            onChange={handleChange}
            style={s.input}
          >
            <option value="resident">Resident</option>
            <option value="admin">Admin</option>
          </select>

          {form.role === "resident" && (
            <>
              <label style={s.label}>Flat Number</label>
              <input
                className="ai-input"
                type="text"
                name="flatNumber"
                placeholder="eg. 501"
                value={form.flatNumber}
                onChange={handleChange}
                required
                style={s.input}
              />
            </>
          )}

          <button type="submit" className="ai-btn" disabled={loading} style={s.submitBtn}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p style={s.switchText}>
          Already have an account?{" "}
          <a
            href="#"
            className="ai-link"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            style={s.switchLink}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

function getStyles(dark) {
  const text = {
    primary: dark ? "#f0efe9" : "#201E18",
    secondary: dark ? "#b8b6ae" : "#80796A",
    label: dark ? "#d6d3c8" : "#4A463C",
  };
  const cardBg = dark ? "#1c2333" : "#FFFFFF";
  const pageBg = dark ? "#11151f" : "#F5F3EE";
  const cardBorder = dark ? "#2c3344" : "#E6E2D6";
  const inputBg = dark ? "#222a3c" : "#FAF9F5";
  const inputBorder = dark ? "#384058" : "#E0DBCB";
  const errorBg = dark ? "#3a2a1f" : "#FBEAE1";
  const errorText = dark ? "#f0a36b" : "#A8521F";
  const successBg = dark ? "#1f3a23" : "#EAF3DE";
  const successText = dark ? "#a8d878" : "#3B6D11";

  return {
    placeholderColor: dark ? "#6b6f80" : "#A6A296",
    page: {
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: pageBg,
      fontFamily: "'Inter', sans-serif",
      padding: "24px",
    },
    card: {
      width: "100%",
      maxWidth: 360,
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 12,
      padding: "36px 32px",
      position: "relative",
    },
    toggleRow: { display: "flex", justifyContent: "flex-end", marginBottom: 18 },
    themeToggle: {
      background: "none",
      border: `1px solid ${inputBorder}`,
      borderRadius: 6,
      padding: "5px 10px",
      fontSize: 11.5,
      color: text.secondary,
      cursor: "pointer",
      opacity: 0.85,
      fontFamily: "inherit",
    },
    heading: { fontSize: 22, fontWeight: 700, color: text.primary, margin: "0 0 4px" },
    subheading: { color: text.secondary, fontSize: 13.5, margin: "0 0 24px" },
    errorBox: { background: errorBg, color: errorText, fontSize: 13, padding: "8px 12px", borderRadius: 8, margin: "0 0 18px" },
    successBox: { background: successBg, color: successText, fontSize: 13, padding: "8px 12px", borderRadius: 8, margin: "0 0 18px" },
    label: { display: "block", fontSize: 12.5, fontWeight: 500, color: text.label, marginBottom: 6 },
    input: {
      width: "100%",
      padding: "10px 12px",
      fontSize: 14,
      border: `1px solid ${inputBorder}`,
      borderRadius: 8,
      background: inputBg,
      color: text.primary,
      marginBottom: 16,
      transition: "border-color 0.15s, box-shadow 0.15s",
    },
    eyeBtn: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 12,
      color: text.secondary,
      opacity: 0.75,
      fontFamily: "inherit",
    },
    submitBtn: {
      width: "100%",
      padding: "11px 0",
      background: "#C1622D",
      color: "#FFFFFF",
      border: "none",
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background 0.15s",
      marginTop: 8,
    },
    switchText: { textAlign: "center", fontSize: 13, color: text.secondary, marginTop: 22 },
    switchLink: { color: text.primary, fontWeight: 600, textDecoration: "none" },
  };
}