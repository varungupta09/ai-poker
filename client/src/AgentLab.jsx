import { useState } from "react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_AGENTS = [
  {
    id: 1,
    name: "DeepStack v2.1",
    type: "API Agent",
    status: "Connected",
    winRate: 61,
    matches: 214,
    updated: "2h ago",
    rank: "Gold II",
    avgProfit: 127,
    version: "2.1.0",
    created: "Jan 12, 2026",
    active: true,
    description:
      "Advanced poker agent using deep reinforcement learning with multi-street decision trees. Optimized for 6-max cash games with a focus on exploitative play against weak opponents.",
    perf: [45, 52, 48, 58, 55, 63, 61, 67, 61, 65, 63, 61],
  },
  {
    id: 2,
    name: "AlphaFoldBot",
    type: "API Agent",
    status: "Connected",
    winRate: 54,
    matches: 189,
    updated: "5h ago",
    rank: "Silver I",
    avgProfit: 83,
    version: "1.3.2",
    created: "Dec 5, 2025",
    active: false,
    description:
      "Protein-folding inspired decision model that adapts strategy based on opponent history and tendencies. Excels in heads-up and short-handed scenarios.",
    perf: [38, 42, 50, 46, 54, 51, 57, 53, 56, 54, 55, 54],
  },
  {
    id: 3,
    name: "BluffMaster9000",
    type: "Local Agent",
    status: "Offline",
    winRate: 48,
    matches: 92,
    updated: "2d ago",
    rank: "Bronze III",
    avgProfit: -12,
    version: "0.9.1",
    created: "Nov 20, 2025",
    active: false,
    description:
      "Experimental bluff-heavy agent testing a high-variance strategy. Currently in development — not recommended for ranked matches.",
    perf: [50, 45, 40, 52, 44, 43, 50, 46, 48, 47, 49, 48],
  },
  {
    id: 4,
    name: "NeuralAce",
    type: "API Agent",
    status: "Connected",
    winRate: 67,
    matches: 310,
    updated: "30m ago",
    rank: "Platinum I",
    avgProfit: 245,
    version: "3.0.0",
    created: "Oct 8, 2025",
    active: false,
    description:
      "Top-ranked agent built on transformer-based hand evaluation. Consistently outperforms in both cash and tournament formats with a tight but adaptable range.",
    perf: [50, 55, 60, 58, 64, 62, 68, 65, 70, 67, 72, 67],
  },
  {
    id: 5,
    name: "RiverBot",
    type: "Local Agent",
    status: "Offline",
    winRate: 43,
    matches: 55,
    updated: "1w ago",
    rank: "Bronze I",
    avgProfit: -45,
    version: "0.5.0",
    created: "Feb 1, 2026",
    active: false,
    description:
      "Early-stage bot focused on river play decision-making. Limited match data — needs more training rounds before competitive deployment.",
    perf: [35, 40, 38, 42, 39, 43, 41, 44, 42, 43, 44, 43],
  },
];

const RANK_COLORS = {
  "Bronze I": "#b45309", "Bronze II": "#b45309", "Bronze III": "#b45309",
  "Silver I": "#64748b", "Silver II": "#64748b", "Silver III": "#64748b",
  "Gold I":   "#ca8a04", "Gold II":   "#ca8a04", "Gold III":   "#ca8a04",
  "Platinum I": "#0891b2", "Platinum II": "#0891b2",
  "Diamond I": "#7c3aed",
  "Unranked": "#94a3b8",
};

const AGENT_COLORS = ["#ef4444", "#7c3aed", "#0891b2", "#059669", "#d97706"];
const STRATEGY_TYPES = ["GTO Solver", "Exploitative", "Bluff-Heavy", "Tight-Aggressive", "Loose-Passive", "Custom"];
const DECISION_TIMES = ["500ms", "1s", "2s", "5s", "10s"];

const initials = (name) =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts }) {
  return (
    <div className="al-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="al-toast">
          <span>{t.icon}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return (
    <span className={`al-status-badge ${status === "Connected" ? "connected" : "offline"}`}>
      <span className="al-status-dot" />
      {status}
    </span>
  );
}

// ─── Mini SVG Line Chart ──────────────────────────────────────────────────────

function MiniLineChart({ data, color = "#ef4444", height = 72 }) {
  const W = 480;
  const H = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 6;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return [x, y];
  });

  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const fill = `0,${H} ${polyline} ${W},${H}`;

  const lastX = pts[pts.length - 1][0];
  const lastY = pts[pts.length - 1][1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ overflow: "visible", display: "block" }}
    >
      <defs>
        <linearGradient id="al-chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#al-chartGrad)" />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill={color} />
    </svg>
  );
}

// ─── Import Agent Modal ───────────────────────────────────────────────────────

function ImportAgentModal({ onClose, onImport }) {
  const [name, setName]               = useState("");
  const [url, setUrl]                 = useState("");
  const [apiKey, setApiKey]           = useState("");
  const [decisionTime, setDecisionTime] = useState("1s");
  const [testing, setTesting]         = useState(false);
  const [testResult, setTestResult]   = useState(null);

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult("✅ Agent connected  (Latency: 124ms)");
    }, 1800);
  }

  function handleImport() {
    if (!name.trim()) return;
    onImport({ name: name.trim(), url });
  }

  return (
    <div className="al-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="al-modal">
        <div className="al-modal-header">
          <div>
            <div className="al-modal-title">Import Agent</div>
            <div className="al-modal-sub">Connect an external API agent to PokerAI</div>
          </div>
          <button className="al-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="al-modal-body">
          <div className="al-field">
            <label className="al-label">Agent Name</label>
            <input className="al-input" placeholder="e.g. MyBot v1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="al-field">
            <label className="al-label">Endpoint URL</label>
            <input className="al-input" placeholder="https://your-agent.api/endpoint" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="al-field">
            <label className="al-label">API Key <span className="al-optional">(optional)</span></label>
            <input className="al-input" type="password" placeholder="sk-••••••••••••••••" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div className="al-field">
            <label className="al-label">Decision Time Limit</label>
            <select className="al-select" value={decisionTime} onChange={(e) => setDecisionTime(e.target.value)}>
              {DECISION_TIMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          {testResult && <div className="al-test-result">{testResult}</div>}
        </div>

        <div className="al-modal-footer">
          <button className="al-btn-ghost" onClick={handleTest} disabled={testing}>
            {testing
              ? <><span className="al-spinner" />Testing...</>
              : "Test Connection"}
          </button>
          <button className="al-btn-primary" onClick={handleImport} disabled={!name.trim()}>
            Import Agent
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Agent Modal ───────────────────────────────────────────────────────

function CreateAgentModal({ onClose, onCreate }) {
  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [strategy, setStrategy]     = useState("GTO Solver");

  function handleCreate() {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description, strategy });
  }

  return (
    <div className="al-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="al-modal">
        <div className="al-modal-header">
          <div>
            <div className="al-modal-title">Create Agent</div>
            <div className="al-modal-sub">Configure a new poker AI agent</div>
          </div>
          <button className="al-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="al-modal-body">
          <div className="al-field">
            <label className="al-label">Agent Name</label>
            <input className="al-input" placeholder="e.g. AceBot v1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="al-field">
            <label className="al-label">Description <span className="al-optional">(optional)</span></label>
            <textarea className="al-input al-textarea" placeholder="Describe your agent's strategy..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="al-field">
            <label className="al-label">Strategy Type</label>
            <select className="al-select" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
              {STRATEGY_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="al-modal-footer">
          <button className="al-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="al-btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

function AgentCard({ agent, colorIdx, onView, onTest }) {
  const color = AGENT_COLORS[colorIdx % AGENT_COLORS.length];
  return (
    <div className="al-agent-card" onClick={onView}>
      <div className="al-card-header">
        <div
          className="al-agent-icon"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
        >
          {initials(agent.name)}
        </div>
        <div className="al-agent-meta">
          <div className="al-agent-name">{agent.name}</div>
          <div className="al-agent-type">{agent.type}</div>
        </div>
        {agent.active && <div className="al-active-tag">Active</div>}
      </div>

      <StatusBadge status={agent.status} />

      <div className="al-card-stats">
        <div className="al-stat">
          <div
            className="al-stat-num"
            style={{
              color:
                agent.winRate >= 55 ? "#16a34a"
                : agent.winRate >= 45 ? "#d97706"
                : "#ef4444",
            }}
          >
            {agent.winRate}%
          </div>
          <div className="al-stat-lbl">Win Rate</div>
        </div>
        <div className="al-stat">
          <div className="al-stat-num">{agent.matches}</div>
          <div className="al-stat-lbl">Matches</div>
        </div>
        <div className="al-stat">
          <div className="al-stat-num" style={{ fontSize: 10 }}>{agent.updated}</div>
          <div className="al-stat-lbl">Updated</div>
        </div>
      </div>

      <div className="al-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="al-btn-card" onClick={onView}>View Agent</button>
        <button className="al-btn-card-ghost" onClick={onTest}>Test</button>
      </div>
    </div>
  );
}

// ─── Agent List Page ──────────────────────────────────────────────────────────

function AgentListPage({ agents, onView, onShowImport, onShowCreate, onTest }) {
  const avgWin = Math.round(agents.reduce((s, a) => s + a.winRate, 0) / agents.length);
  const activeAgent = agents.find((a) => a.active);

  return (
    <div className="al-list-page">
      {/* Top bar */}
      <div className="al-list-topbar">
        <div>
          <h1 className="al-page-title">Agent Lab</h1>
          <p className="al-page-sub">Create, import, and manage your poker agents</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="al-btn-ghost" onClick={onShowImport}>Import Agent</button>
          <button className="al-btn-primary" onClick={onShowCreate}>+ Create Agent</button>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="al-statsbar">
        <div className="al-quick-stat">
          <span className="al-quick-num">{agents.length}</span>
          <span className="al-quick-lbl">Total Agents</span>
        </div>
        <div className="al-quick-stat">
          <span className="al-quick-num" style={{ color: "#16a34a" }}>
            {agents.filter((a) => a.status === "Connected").length}
          </span>
          <span className="al-quick-lbl">Connected</span>
        </div>
        <div className="al-quick-stat">
          <span className="al-quick-num" style={{ color: "#ef4444", fontSize: 12 }}>
            {activeAgent?.name ?? "—"}
          </span>
          <span className="al-quick-lbl">Active Agent</span>
        </div>
        <div className="al-quick-stat">
          <span className="al-quick-num">{avgWin}%</span>
          <span className="al-quick-lbl">Avg Win Rate</span>
        </div>
      </div>

      {/* Grid */}
      <div className="al-agent-grid">
        {agents.map((agent, i) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            colorIdx={i}
            onView={() => onView(agent, i)}
            onTest={() => onTest(agent)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AgentSidebar({ agent, colorIdx, onSetActive }) {
  const color = AGENT_COLORS[colorIdx % AGENT_COLORS.length];
  return (
    <div className="al-sidebar">
      <div
        className="al-sidebar-avatar"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
      >
        {initials(agent.name)}
      </div>
      <div className="al-sidebar-name">{agent.name}</div>
      <StatusBadge status={agent.status} />
      <div className="al-sidebar-type">{agent.type}</div>
      <hr className="al-sidebar-divider" />

      <div className="al-sidebar-row">
        <span className="al-sidebar-lbl">Active</span>
        <button
          className={`al-toggle ${agent.active ? "on" : ""}`}
          onClick={onSetActive}
          title={agent.active ? "Currently active" : "Set as active"}
        >
          <span className="al-toggle-thumb" />
        </button>
      </div>

      <div className="al-sidebar-meta-list">
        {[
          ["Version", `v${agent.version}`],
          ["Created", agent.created],
          ["Updated", agent.updated],
          ["Rank", agent.rank],
        ].map(([lbl, val]) => (
          <div key={lbl} className="al-sidebar-meta-row">
            <span className="al-sidebar-meta-lbl">{lbl}</span>
            <span
              className="al-sidebar-meta-val"
              style={lbl === "Rank" ? { color: RANK_COLORS[val] ?? "#374151" } : {}}
            >
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

function AgentStatsPanel({ agent }) {
  return (
    <div className="al-stats-panel">
      {/* Overview */}
      <div className="al-panel-section">
        <div className="al-section-title">Overview</div>
        <p className="al-overview-text">{agent.description}</p>
      </div>

      {/* Performance */}
      <div className="al-panel-section">
        <div className="al-section-title">Performance</div>
        <div className="al-perf-stats">
          <div className="al-perf-stat">
            <div
              className="al-perf-num"
              style={{
                color:
                  agent.winRate >= 55 ? "#16a34a"
                  : agent.winRate >= 45 ? "#d97706"
                  : "#ef4444",
              }}
            >
              {agent.winRate}%
            </div>
            <div className="al-perf-lbl">Win Rate</div>
          </div>
          <div className="al-perf-stat">
            <div className="al-perf-num">{agent.matches}</div>
            <div className="al-perf-lbl">Matches</div>
          </div>
          <div className="al-perf-stat">
            <div
              className="al-perf-num"
              style={{ color: agent.avgProfit >= 0 ? "#16a34a" : "#ef4444" }}
            >
              {agent.avgProfit >= 0 ? "+" : ""}{agent.avgProfit}
            </div>
            <div className="al-perf-lbl">Avg Profit</div>
          </div>
          <div className="al-perf-stat">
            <div
              className="al-perf-rank"
              style={{ color: RANK_COLORS[agent.rank] ?? "#374151" }}
            >
              {agent.rank}
            </div>
            <div className="al-perf-lbl">Rank Tier</div>
          </div>
        </div>

        <div className="al-chart-wrap">
          <div className="al-chart-label">Win rate — last 12 sessions</div>
          <MiniLineChart data={agent.perf} height={72} />
        </div>
      </div>

      {/* Actions */}
      <div className="al-panel-section">
        <div className="al-section-title">Actions</div>
        <div className="al-action-btns">
          <button className="al-action-btn ghost">Test Agent</button>
          <button className="al-action-btn ghost">Play Casual</button>
          <button className="al-action-btn primary">Play Ranked</button>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Detail Page ────────────────────────────────────────────────────────

function AgentDetailPage({ agents, agentId, colorIdx, onBack, onSetActive }) {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return null;
  return (
    <div className="al-detail-page">
      <button className="al-back-btn" onClick={onBack}>← Back to Agents</button>
      <div className="al-detail-layout">
        <AgentSidebar agent={agent} colorIdx={colorIdx} onSetActive={() => onSetActive(agent.id)} />
        <AgentStatsPanel agent={agent} />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AgentLab({ onBackHome }) {
  const [agents, setAgents]           = useState(INITIAL_AGENTS);
  const [view, setView]               = useState("list");
  const [selectedId, setSelectedId]   = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showImport, setShowImport]   = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [toasts, setToasts]           = useState([]);

  function toast(message, icon = "✅") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }

  function handleView(agent, idx) {
    setSelectedId(agent.id);
    setSelectedIdx(idx);
    setView("detail");
  }

  function handleSetActive(id) {
    setAgents((prev) => prev.map((a) => ({ ...a, active: a.id === id })));
    const name = agents.find((a) => a.id === id)?.name ?? "Agent";
    toast(`${name} set as active agent`, "⚡");
  }

  function handleImport({ name }) {
    const newAgent = {
      id: Date.now(),
      name,
      type: "API Agent",
      status: "Connected",
      winRate: Math.floor(Math.random() * 20 + 45),
      matches: 0,
      updated: "just now",
      rank: "Unranked",
      avgProfit: 0,
      version: "1.0.0",
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      active: false,
      description: "Newly imported agent. Play some matches to start building a performance history.",
      perf: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    };
    setAgents((prev) => [...prev, newAgent]);
    setShowImport(false);
    toast("Agent imported successfully", "✅");
  }

  function handleCreate({ name, description, strategy }) {
    const newAgent = {
      id: Date.now(),
      name,
      type: "Local Agent",
      status: "Offline",
      winRate: 0,
      matches: 0,
      updated: "just now",
      rank: "Unranked",
      avgProfit: 0,
      version: "0.1.0",
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      active: false,
      description: description || `${strategy} agent. No matches played yet.`,
      perf: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    };
    setAgents((prev) => [...prev, newAgent]);
    setShowCreate(false);
    toast(`"${name}" created`, "🤖");
  }

  function handleTest(agent) {
    toast(`Testing ${agent.name}...`, "🔬");
  }

  return (
    <div className="al-shell">
      {/* Breadcrumb topline */}
      <div className="al-topline">
        <button className="al-topline-back" onClick={onBackHome}>← Home</button>
        <div className="al-topline-breadcrumb">
          <span
            className={view === "detail" ? "al-breadcrumb-link" : "al-breadcrumb-current"}
            onClick={view === "detail" ? () => setView("list") : undefined}
            style={view === "detail" ? { cursor: "pointer" } : {}}
          >
            Agent Lab
          </span>
          {view === "detail" && selectedId && (
            <>
              <span className="al-breadcrumb-sep">/</span>
              <span className="al-breadcrumb-current">
                {agents.find((a) => a.id === selectedId)?.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* View */}
      {view === "list" ? (
        <AgentListPage
          agents={agents}
          onView={handleView}
          onShowImport={() => setShowImport(true)}
          onShowCreate={() => setShowCreate(true)}
          onTest={handleTest}
        />
      ) : (
        <AgentDetailPage
          agents={agents}
          agentId={selectedId}
          colorIdx={selectedIdx}
          onBack={() => setView("list")}
          onSetActive={handleSetActive}
        />
      )}

      {/* Modals */}
      {showImport && (
        <ImportAgentModal onClose={() => setShowImport(false)} onImport={handleImport} />
      )}
      {showCreate && (
        <CreateAgentModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
