import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navigate = useNavigate();
  const dark = theme === "dark";
  const s = getStyles(dark);

  const toggleTheme = () => {
    const next = dark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/login" : "/register";

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Try again.");
      }

      if (mode === "login") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("flatNumber", data.flatNumber || "");

        if (data.role === "admin") {
          navigate("/dashboard");
        } else {
          navigate("/resident");
        }
      } else {
        setMode("login");
        setError("");
        setPassword("");
        alert("Registration successful! Please login.");
      }
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

        <h1 style={s.heading}>
          {mode === "login" ? "Sign in to ApartIS" : "Create your account"}
        </h1>
        <p style={s.subheading}>
          {mode === "login"
            ? "Manage your building from one dashboard."
            : "Set up access in a minute."}
        </p>

        {error && <p style={s.errorBox}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input
            className="ai-input"
            type="email"
            placeholder="you@apartis.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={s.input}
          />

          <label style={s.label}>Password</label>
          <div style={{ position: "relative", marginBottom: 18 }}>
            <input
              className="ai-input"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...s.input, padding: "10px 44px 10px 12px", marginBottom: 0 }}
            />
            <button
              type="button"
              className="ai-eye"
              onClick={() => setShowPw((sw) => !sw)}
              style={s.eyeBtn}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {mode === "login" && <div style={{ marginBottom: 20 }} />}

          <button type="submit" className="ai-btn" disabled={loading} style={s.submitBtn}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <p style={s.switchText}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <a
                href="#"
                className="ai-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register");
                }}
                style={s.switchLink}
              >
                Register here
              </a>
            </>
          ) : (
            <>
              Already registered?{" "}
              <a
                href="#"
                className="ai-link"
                onClick={(e) => {
                  e.preventDefault();
                  setError("");
                  setMode("login");
                }}
                style={s.switchLink}
              >
                Sign in
              </a>
            </>
          )}
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
    subheading: { color: text.secondary, fontSize: 13.5, margin: "0 0 28px" },
    errorBox: { background: errorBg, color: errorText, fontSize: 13, padding: "8px 12px", borderRadius: 8, margin: "0 0 18px" },
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
    forgotLink: { fontSize: 12.5, color: "#C1622D", textDecoration: "none" },
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
    },
    switchText: { textAlign: "center", fontSize: 13, color: text.secondary, marginTop: 22 },
    switchLink: { color: text.primary, fontWeight: 600, textDecoration: "none" },
  };
}