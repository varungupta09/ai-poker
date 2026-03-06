import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_STYLES = ["Nit", "TAG", "LAG", "Maniac", "Balanced"];

const BASE_STYLE_PRESETS = {
  nit:      { aggression: 20, bluffFreq: 15, riskTolerance: 25, looseness: 20 },
  tag:      { aggression: 70, bluffFreq: 30, riskTolerance: 45, looseness: 30 },
  lag:      { aggression: 75, bluffFreq: 60, riskTolerance: 65, looseness: 70 },
  maniac:   { aggression: 90, bluffFreq: 80, riskTolerance: 85, looseness: 80 },
  balanced: { aggression: 50, bluffFreq: 50, riskTolerance: 50, looseness: 50 },
};

const BASE_STYLE_FULL = {
  nit:      "Nit",
  tag:      "TAG — Tight Aggressive",
  lag:      "LAG — Loose Aggressive",
  maniac:   "Maniac",
  balanced: "Balanced",
};

const BASE_STYLE_DESCS = {
  nit:      "Plays very few hands and almost never bluffs. Waits for strong cards before betting.",
  tag:      "Tight but aggressive — plays few hands but bets hard when ahead. A solid, disciplined style.",
  lag:      "Plays lots of hands and applies constant pressure. Unpredictable and hard to read.",
  maniac:   "Raises and bluffs constantly. High variance, chaotic — opponents never know what to expect.",
  balanced: "A mix of everything. Doesn't over-commit to any one style. Safe default for beginners.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function predictPlayStyle(looseness, aggression, bluffFreq) {
  if (looseness < 30 && aggression < 35)                       return { label: "Nit",                    color: "#64748b" };
  if (looseness >= 65 && aggression >= 70 && bluffFreq >= 65) return { label: "Maniac",                 color: "#ef4444" };
  if (looseness < 45  && aggression >= 60)                    return { label: "TAG — Tight Aggressive", color: "#3b82f6" };
  if (looseness >= 60 && aggression >= 60)                    return { label: "LAG — Loose Aggressive", color: "#f97316" };
  if (looseness >= 55 && aggression < 45)                     return { label: "Loose Passive",          color: "#eab308" };
  if (looseness < 40  && aggression < 45)                     return { label: "Tight Passive",          color: "#94a3b8" };
  return                                                             { label: "Balanced",               color: "#22c55e" };
}

// ─── QuickSlider ──────────────────────────────────────────────────────────────

function QuickSlider({ label, leftLabel, rightLabel, value, onChange }) {
  const accent = value >= 70 ? "#ef4444" : value >= 40 ? "#f97316" : "#3b82f6";
  const bg     = value >= 70 ? "#fef2f2" : value >= 40 ? "#fff7ed" : "#eff6ff";
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#0f172a", fontWeight: 600, fontSize: 13 }}>{label}</span>
        <span style={{ color: accent, fontWeight: 700, fontSize: 12, background: bg, borderRadius: 4, padding: "1px 7px" }}>{value}</span>
      </div>
      <input
        type="range" min="0" max="100" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ color: "#94a3b8", fontSize: 11 }}>{leftLabel}</span>
        <span style={{ color: "#94a3b8", fontSize: 11 }}>{rightLabel}</span>
      </div>
    </div>
  );
}

// ─── QuickAgent ───────────────────────────────────────────────────────────────

/**
 * Props:
 *   onBack    () => void          — go back to the picker
 *   onClose   () => void          — close the whole modal
 *   onCreate  (agentData) => void — called with the final agent object
 */
export default function QuickAgent({ onBack, onClose, onCreate }) {
  const [name, setName]                   = useState("");
  const [baseStyle, setBaseStyle]         = useState("balanced");
  const [aggression, setAggression]       = useState(50);
  const [bluffFreq, setBluffFreq]         = useState(50);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [looseness, setLooseness]         = useState(50);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  function handleBaseStyle(style) {
    const key = style.toLowerCase();
    setBaseStyle(key);
    const p = BASE_STYLE_PRESETS[key];
    if (p) {
      setAggression(p.aggression);
      setBluffFreq(p.bluffFreq);
      setRiskTolerance(p.riskTolerance);
      setLooseness(p.looseness);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;

    const agentName = name.trim().toLowerCase();
    setError(null);

    if (agentName.length < 3 || agentName.length > 20) {
      setError("Agent name must be between 3 and 20 characters.");
      return;
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError("You must be logged in to create an agent.");
      return;
    }

    const { label: styleLabel } = predictPlayStyle(looseness, aggression, bluffFreq);
    const agentConfig = {
      type: "quick_agent",
      base_style: baseStyle,
      aggression,
      bluff_frequency: bluffFreq,
      risk_tolerance: riskTolerance,
      looseness,
    };

    setLoading(true);
    const { error: insertError } = await supabase
      .from("user_agents")
      .insert({
        user_id:         user.id,
        agent_name:      agentName,
        description:     null,
        strategy_type:   baseStyle,
        is_public:       false,
        strategy_config: {
          base_style:      baseStyle,
          aggression,
          bluff_frequency: bluffFreq,
          risk_tolerance:  riskTolerance,
          looseness,
        },
      });
    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("That agent name is already taken. Please choose another.");
      } else {
        setError(insertError.message);
      }
      return;
    }

    onCreate({
      name: agentName,
      description: `${styleLabel} · Quick Agent`,
      strategy: baseStyle.toUpperCase(),
      agentConfig,
    });
  }

  const { label: styleLabel, color: styleColor } = predictPlayStyle(looseness, aggression, bluffFreq);

  return (
    <div className="al-modal" style={{ maxWidth: 560 }}>
      <div className="al-modal-header">
        <div>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 4 }}
          >
            ← Back
          </button>
          <div className="al-modal-title">Quick Agent</div>
          <div className="al-modal-sub">Build your poker personality in seconds</div>
        </div>
        <button className="al-modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="al-modal-body" style={{ maxHeight: "62vh", overflowY: "auto" }}>

        {/* Agent Name */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: "#0f172a", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Agent Name</div>
          <input
            className="al-input"
            placeholder="e.g. RiverShark"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Base Style */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ color: "#0f172a", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Base Style</div>
          <div style={{ display: "flex", gap: 6 }}>
            {BASE_STYLES.map((s) => {
              const key = s.toLowerCase();
              return (
                <button
                  key={key}
                  onClick={() => handleBaseStyle(s)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    border: baseStyle === key ? "1.5px solid #0f172a" : "1.5px solid #e2e8f0",
                    borderRadius: 6,
                    background: baseStyle === key ? "#0f172a" : "#fff",
                    color: baseStyle === key ? "#fff" : "#64748b",
                    fontWeight: baseStyle === key ? 700 : 500,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: "#0f172a", fontWeight: 600, fontSize: 13, marginBottom: 3 }}>
              {BASE_STYLE_FULL[baseStyle]}
            </div>
            <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>
              {BASE_STYLE_DESCS[baseStyle]}
            </div>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", marginBottom: 22 }} />

        {/* Sliders */}
        <QuickSlider label="Aggression"      leftLabel="Passive" rightLabel="Aggressive" value={aggression}    onChange={setAggression} />
        <QuickSlider label="Bluff Frequency" leftLabel="Rare"    rightLabel="Frequent"   value={bluffFreq}     onChange={setBluffFreq} />
        <QuickSlider label="Risk Tolerance"  leftLabel="Safe"    rightLabel="Risky"      value={riskTolerance} onChange={setRiskTolerance} />
        <QuickSlider label="Hand Looseness"  leftLabel="Tight"   rightLabel="Loose"      value={looseness}     onChange={setLooseness} />

        {/* Predicted Style */}
        <div style={{
          marginTop: 4,
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ color: "#64748b", fontSize: 12, fontWeight: 500 }}>Predicted Play Style</span>
          <span style={{
            color: styleColor,
            fontWeight: 700,
            fontSize: 13,
            background: `${styleColor}18`,
            padding: "3px 10px",
            borderRadius: 5,
          }}>{styleLabel}</span>
        </div>

      </div>

      <div className="al-modal-footer">
        <button className="al-btn-ghost" onClick={onBack}>Back</button>
        {error && (
          <span style={{ color: "#ef4444", fontSize: 12, flex: 1, textAlign: "center" }}>{error}</span>
        )}
        <button className="al-btn-primary" onClick={handleCreate} disabled={!name.trim() || loading}>
          {loading ? "Creating…" : "Create Agent"}
        </button>
      </div>
    </div>
  );
}
