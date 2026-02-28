// CountryPokerTable.jsx
// Venue: back-porch poker at golden hour — warm sunset sky, rolling hills,
// and a real weathered wooden table with worn green felt.

import Card from "../components/Card.jsx";

const SEAT_POSITIONS = {
  bottom: { left: "50%", top: "88%" },
  top:    { left: "50%", top: "12%" },
  left:   { left: "10%", top: "50%" },
  right:  { left: "90%", top: "50%" },
};

// ── Seat ──────────────────────────────────────────────────────────────────────
function CountrySeat({ player, dealerPeeking, isDealerView }) {
  const pos    = SEAT_POSITIONS[player.position];
  const isYou    = player.id === "you";
  const isDealer = player.id === "dealer";

  function cardProps() {
    if (isYou)                     return { faceUp: true,  peeking: false };
    if (isDealerView)              return { faceUp: true,  peeking: false };
    if (isDealer && dealerPeeking) return { faceUp: true,  peeking: true  };
    return { faceUp: false, peeking: false };
  }

  const cp = cardProps();

  return (
    <div
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      {/* Cards */}
      <div style={{ display: "flex", gap: 4 }}>
        {player.cards.length > 0
          ? player.cards.map((c, i) => (
              <Card key={i} card={c} faceUp={cp.faceUp} peeking={cp.peeking} />
            ))
          : [0, 1].map((i) => <Card key={i} card={null} />)}
      </div>

      {/* Name badge */}
      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 8,
          background: isYou
            ? "rgba(120, 55, 10, 0.88)"
            : "rgba(40, 22, 8, 0.82)",
          border: `1px solid ${
            isYou ? "#e07830" : isDealer ? "#d4aa40" : "rgba(180,120,50,0.35)"
          }`,
          color: isYou ? "#fde68a" : isDealer ? "#fcd34d" : "#d9c4a0",
          borderRadius: 3,
          padding: "4px 8px",
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
          textShadow: "0 1px 3px rgba(0,0,0,0.7)",
        }}
      >
        {player.name}
        {isDealer && <span style={{ marginLeft: 4 }}>🃏</span>}
      </div>

      {/* Chips */}
      {player.chips != null && (
        <div
          style={{
            fontSize: 8,
            color: "rgba(253,215,120,0.60)",
            fontFamily: '"Press Start 2P", monospace',
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {player.chips} chips
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CountryPokerTable({
  view,
  players,
  community,
  dealerPeeking,
  pot,
  peekHint,
}) {
  const isDealerView = view === "dealer";
  const tilt =
    view === "topdown" ? "rotateX(10deg)"
    : view === "dealer"  ? "rotateX(35deg) rotate(180deg)"
    :                       "rotateX(35deg)";

  return (
    <div className="cv-wrap">

      {/* ── Sky — warm sunset gradient ── */}
      <div className="cv-sky" />

      {/* ── Sun disc ── */}
      <div className="cv-sun" />

      {/* ── Sun corona / rays ── */}
      <div className="cv-sun-rays" />

      {/* ── Horizon colour bloom ── */}
      <div className="cv-horizon" />

      {/* ── Distant hills (silhouette) ── */}
      <div className="cv-hills-far" />

      {/* ── Near rolling hills ── */}
      <div className="cv-hills-near" />

      {/* ── Tree lines (silhouettes) ── */}
      <div className="cv-trees-far" />
      <div className="cv-trees-near" />
      <div className="cv-fence" />
      <div className="cv-foreground-edge" />

      {/* ── Ground / dirt ── */}
      <div className="cv-ground" />

      {/* ── Atmospheric haze over horizon ── */}
      <div className="cv-haze" />

      {/* ── Dust / warmth vignette ── */}
      <div className="cv-vignette" />

      {/* ── Table scene ── */}
      <div className="cv-scene">
        <div
          className="cv-table-wrap"
          style={{ transform: tilt }}
        >
          {/* Wooden table body */}
          <div className="cv-table">

            {/* Wood grain streaks */}
            <div className="cv-grain" />

            {/* Worn felt inset */}
            <div className="cv-felt">
              <div className="cv-felt-inner" />

              {/* Community cards */}
              <div className="cv-community">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Card
                    key={i}
                    card={community[i] || null}
                    faceUp={community[i] != null}
                  />
                ))}
              </div>

              {/* Pot */}
              {pot > 0 && (
                <div className="cv-pot">POT: {pot}</div>
              )}

              {/* Dealer button */}
              <div className="cv-dealer-btn-wrap">
                <div className="cv-dealer-btn">D</div>
              </div>

              {/* Seats */}
              {players.map((p) => (
                <CountrySeat
                  key={p.id}
                  player={p}
                  dealerPeeking={dealerPeeking}
                  isDealerView={isDealerView}
                />
              ))}

              {/* Peek hint */}
              {peekHint && (
                <div className="peek-hint">DEALER IS PEEKING!</div>
              )}
            </div>

            {/* Table edge shadow underneath */}
            <div className="cv-table-shadow" />
          </div>
        </div>
      </div>

      {/* Venue tag */}
      <div className="cv-label">Country Table · Golden Hour</div>
    </div>
  );
}
