import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginScreen({ onNavigate }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.identifier.trim(),
      password: form.password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    onNavigate?.("home");
  }

  return (
    <div style={styles.page}>
      {/* Grid overlay */}
      <div style={styles.gridOverlay} />

      {/* Back button */}
      <button style={styles.backBtn} onClick={() => onNavigate?.("home")}>
        ← Back
      </button>

      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logoRow}>
          <div style={styles.logoBadge}>♠</div>
          <span style={styles.logoText}>PokerAI</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Log in to manage your agents and matches.</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* Email / Username */}
          <div style={styles.field}>
            <label style={styles.label}>Email or Username</label>
            <input
              name="identifier"
              type="text"
              placeholder="you@example.com"
              autoComplete="username"
              value={form.identifier}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: "right", marginTop: -8 }}>
            <button type="button" style={styles.linkBtn}>
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && <p style={styles.errorMsg}>{error}</p>}

          {/* Submit */}
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Sign up redirect */}
        <p style={styles.switchText}>
          Don't have an account?{" "}
          <button style={styles.linkBtn} onClick={() => onNavigate?.("signup")}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Inline styles (mirrors dark HP aesthetic) ────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: "24px 16px",
    fontFamily: "'Inter', sans-serif",
    color: "#fff",
    overflow: "hidden",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
    backgroundSize: "28px 28px",
    pointerEvents: "none",
    zIndex: 0,
  },
  backBtn: {
    position: "absolute",
    top: 24,
    left: 24,
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.55)",
    borderRadius: 8,
    padding: "7px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    zIndex: 10,
    transition: "border-color 0.2s, color 0.2s",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20,
    padding: "44px 40px",
    width: "100%",
    maxWidth: 440,
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 48px rgba(0,0,0,0.55)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
    justifyContent: "center",
  },
  logoBadge: {
    width: 36,
    height: 36,
    background: "linear-gradient(135deg,#dc2626,#991b1b)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 0 12px rgba(220,38,38,0.4)",
  },
  logoText: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 13,
    color: "#fff",
    letterSpacing: "0.04em",
  },
  title: {
    margin: "0 0 6px",
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    margin: "0 0 32px",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.03em",
    textTransform: "uppercase",
  },
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 14,
    color: "#fff",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
    color: "rgba(255,255,255,0.5)",
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    textDecoration: "underline",
    textDecorationColor: "rgba(220,38,38,0.3)",
  },
  errorMsg: {
    margin: 0,
    fontSize: 13,
    color: "#f87171",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8,
    padding: "10px 14px",
  },
  submitBtn: {
    background: "linear-gradient(135deg,#dc2626,#b91c1c)",
    border: "none",
    borderRadius: 10,
    padding: "13px",
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
    cursor: "pointer",
    fontFamily: "'Press Start 2P', monospace",
    letterSpacing: "0.03em",
    boxShadow: "0 0 20px rgba(220,38,38,0.35)",
    marginTop: 4,
    transition: "opacity 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "28px 0 20px",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(255,255,255,0.1)",
    display: "block",
  },
  dividerText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },
  switchText: {
    margin: 0,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
  },
};
