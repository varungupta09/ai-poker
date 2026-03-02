// CountryPokerTable.jsx — Countryside Sundown venue
import countrySideImg from "../images/country-side.jpg";
import Card from "../components/Card.jsx";

const SEAT_POSITIONS = {
  bottom: { left: "50%", top: "88%" },
  top:    { left: "50%", top: "12%" },
  left:   { left: "10%", top: "50%" },
  right:  { left: "90%", top: "50%" },
};

// Static particle seeds — avoids re-generating on every render
const PARTICLES = [
  { id: 0,  size: 3, x: "8%",  dur: 14, delay: 0,   drift: "70px"  },
  { id: 1,  size: 4, x: "19%", dur: 19, delay: -5,  drift: "-80px" },
  { id: 2,  size: 3, x: "33%", dur: 12, delay: -9,  drift: "110px" },
  { id: 3,  size: 5, x: "47%", dur: 22, delay: -2,  drift: "-50px" },
  { id: 4,  size: 3, x: "58%", dur: 16, delay: -13, drift: "90px"  },
  { id: 5,  size: 4, x: "70%", dur: 18, delay: -6,  drift: "-100px"},
  { id: 6,  size: 3, x: "82%", dur: 13, delay: -3,  drift: "60px"  },
  { id: 7,  size: 4, x: "25%", dur: 20, delay: -16, drift: "120px" },
  { id: 8,  size: 3, x: "63%", dur: 15, delay: -8,  drift: "-70px" },
  { id: 9,  size: 4, x: "90%", dur: 17, delay: -11, drift: "85px"  },
  { id: 10, size: 3, x: "42%", dur: 24, delay: -19, drift: "-60px" },
  { id: 11, size: 4, x: "76%", dur: 11, delay: -4,  drift: "95px"  },
];

// ── Floating dust / pollen particles ──────────────────────────────────────────
function FloatingParticles() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            bottom: "-8px",
            left: p.x,
            width: p.size,
            height: p.size,
            borderRadius: "50% 40% 55% 45%",
            background: "rgba(220, 180, 80, 0.55)",
            boxShadow: "0 0 3px rgba(255,220,100,0.4)",
            animation: `cs-particle-float ${p.dur}s ${p.delay}s linear infinite`,
            "--cs-drift": p.drift,
          }}
        />
      ))}
    </div>
  );
}

// ── Seat ──────────────────────────────────────────────────────────────────────
function CountrySeat({ player, dealerPeeking, isDealerView }) {
  const pos      = SEAT_POSITIONS[player.position];
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
      <div style={{ display: "flex", gap: 4 }}>
        {player.cards.length > 0
          ? player.cards.map((c, i) => (
              <Card key={i} card={c} faceUp={cp.faceUp} peeking={cp.peeking} />
            ))
          : [0, 1].map((i) => <Card key={i} card={null} />)}
      </div>

      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          background: isYou ? "rgba(90,38,5,0.92)" : "rgba(22,12,4,0.90)",
          border: `2px solid ${isYou ? "#c85c10" : isDealer ? "#b8922a" : "rgba(140,80,25,0.5)"}`,
          color: isYou ? "#f9d06a" : isDealer ? "#f0c040" : "#c8a870",
          borderRadius: 2,
          padding: "5px 10px",
          whiteSpace: "nowrap",
          letterSpacing: "0.08em",
          textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(200,100,20,0.3)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,80,0.08)",
        }}
      >
        {player.name}
        {isDealer && <span style={{ marginLeft: 4 }}>🃏</span>}
      </div>

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
export default function CountryPokerTable({ view, players, community, dealerPeeking, pot, peekHint }) {
  const isDealerView = view === "dealer";
  const tilt =
    view === "topdown" ? "rotateX(10deg)"
    : view === "dealer" ? "rotateX(35deg) rotate(180deg)"
    : "rotateX(35deg)";

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        width: "100vw",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Countryside photo — Ken Burns slow zoom / pan */}
      <img
        src={countrySideImg}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 30%",
          pointerEvents: "none",
          transformOrigin: "center center",
          animation: "cs-ken-burns 38s ease-in-out infinite",
        }}
      />

      {/* Pulsing sun glow — positioned where the sun sits in the photo */}
      <div
        style={{
          position: "absolute",
          right: "24%",
          top: "22%",
          width: 340,
          height: 340,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,210,60,0.28) 0%, rgba(255,130,20,0.10) 45%, transparent 70%)",
          animation: "cs-sun-breathe 5s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Ambient warm light sweep across scene */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(255,180,60,0.06) 0%, transparent 55%, rgba(255,100,20,0.04) 100%)",
          animation: "cs-light-sweep 9s ease-in-out infinite",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Floating dust / pollen particles */}
      <FloatingParticles />

      {/* Edge vignette to ground the scene */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 80% at 50% 55%, transparent 30%, rgba(0,0,0,0.52) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Table */}
      <div
        style={{
          perspective: "1100px",
          perspectiveOrigin: "50% 90%",
          position: "relative",
          zIndex: 3,
        }}
      >
        <div
          style={{
            transform: tilt,
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="rdr-table">
            <div className="rdr-felt">
              <div className="rdr-felt-inner" />

              <div className="rdr-community">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Card key={i} card={community[i] || null} faceUp={community[i] != null} />
                ))}
              </div>

              {pot > 0 && <div className="rdr-pot">POT: {pot}</div>}

              <div className="rdr-dealer-wrap">
                <div className="rdr-dealer-btn">D</div>
              </div>

              {players.map((p) => (
                <CountrySeat
                  key={p.id}
                  player={p}
                  dealerPeeking={dealerPeeking}
                  isDealerView={isDealerView}
                />
              ))}

              {peekHint && <div className="peek-hint">DEALER IS PEEKING!</div>}
            </div>
            <div className="rdr-table-shadow" />
          </div>
        </div>
      </div>

      {/* Venue watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 20,
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          color: "rgba(240,180,70,0.35)",
          letterSpacing: "0.14em",
          zIndex: 4,
          pointerEvents: "none",
          textTransform: "uppercase",
        }}
      >
        Countryside · Sundown
      </div>
    </div>
  );
}
