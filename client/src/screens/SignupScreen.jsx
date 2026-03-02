import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const CURRENT_YEAR = new Date().getFullYear();

export default function SignupScreen({ onNavigate }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!form.firstName.trim())       e.firstName = "Required";
    if (!form.lastName.trim())        e.lastName  = "Required";
    if (!form.username.trim())        e.username  = "Required";
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username.trim()))
                                      e.username  = "3–20 chars: letters, numbers, underscores";
    if (!form.email.includes("@"))    e.email     = "Enter a valid email";
    if (!form.dob)                    e.dob       = "Required";
    if (form.password.length < 8)     e.password  = "At least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    // 1. Create the auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setErrors({ form: signUpError.message });
      return;
    }

    // 2. Insert into user_profiles
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: data.user.id,
      username: form.username.trim(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      dob: form.dob || null,
    });

    setLoading(false);

    if (profileError) {
      setErrors({ form: profileError.message });
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

        <h1 style={styles.title}>Create an account</h1>
        <p style={styles.subtitle}>Build your first agent in minutes.</p>

        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          {/* First / Last name row */}
          <div style={styles.row}>
            <Field label="First Name" error={errors.firstName}>
              <input
                name="firstName"
                type="text"
                placeholder="Ada"
                autoComplete="given-name"
                value={form.firstName}
                onChange={handleChange}
                style={inputStyle(errors.firstName)}
              />
            </Field>
            <Field label="Last Name" error={errors.lastName}>
              <input
                name="lastName"
                type="text"
                placeholder="Lovelace"
                autoComplete="family-name"
                value={form.lastName}
                onChange={handleChange}
                style={inputStyle(errors.lastName)}
              />
            </Field>
          </div>

          {/* Username */}
          <Field label="Username" error={errors.username}>
            <input
              name="username"
              type="text"
              placeholder="ada_lovelace"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              style={inputStyle(errors.username)}
            />
          </Field>

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle(errors.email)}
            />
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" error={errors.dob}>
            <input
              name="dob"
              type="date"
              max={`${CURRENT_YEAR - 13}-12-31`}
              value={form.dob}
              onChange={handleChange}
              style={{ ...inputStyle(errors.dob), colorScheme: "dark" }}
            />
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password}>
            <div style={styles.passwordWrap}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                style={{ ...inputStyle(errors.password), paddingRight: 44 }}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          {/* Confirm Password */}
          <Field label="Confirm Password" error={errors.confirmPassword}>
            <div style={styles.passwordWrap}>
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={{ ...inputStyle(errors.confirmPassword), paddingRight: 44 }}
              />
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowConfirm((v) => !v)}
                aria-label="Toggle confirm password"
              >
                {showConfirm ? "🙈" : "👁"}
              </button>
            </div>
          </Field>

          {/* Terms note */}
          <p style={styles.termsText}>
            By signing up you agree to our{" "}
            <button type="button" style={styles.linkBtn}>Terms of Service</button> and{" "}
            <button type="button" style={styles.linkBtn}>Privacy Policy</button>.
          </p>

          {errors.form && <p style={styles.formError}>{errors.form}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine} />
        </div>

        {/* Log in redirect */}
        <p style={styles.switchText}>
          Already have an account?{" "}
          <button style={styles.linkBtn} onClick={() => onNavigate?.("login")}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
      <label style={styles.label}>{label}</label>
      {children}
      {error && <span style={styles.fieldError}>{error}</span>}
    </div>
  );
}

function inputStyle(hasError) {
  return {
    ...styles.input,
    borderColor: hasError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.12)",
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 20,
    padding: "44px 40px",
    width: "100%",
    maxWidth: 520,
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
  row: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
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
  fieldError: {
    fontSize: 11,
    color: "#f87171",
    marginTop: -4,
  },
  formError: {
    margin: 0,
    fontSize: 13,
    color: "#f87171",
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8,
    padding: "10px 14px",
  },
  termsText: {
    margin: 0,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.6,
  },
  linkBtn: {
    background: "transparent",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "inherit",
    padding: 0,
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    textDecoration: "underline",
    textDecorationColor: "rgba(220,38,38,0.3)",
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
