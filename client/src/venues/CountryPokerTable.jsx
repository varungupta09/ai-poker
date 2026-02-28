// CountryPokerTable.jsx — RDR2 Frontier Sundown
// Landscape is an inline SVG so it ALWAYS renders correctly.

import Card from "../components/Card.jsx";

const SEAT_POSITIONS = {
  bottom: { left: "50%", top: "88%" },
  top:    { left: "50%", top: "12%" },
  left:   { left: "10%", top: "50%" },
  right:  { left: "90%", top: "50%" },
};

// ── SVG Landscape ─────────────────────────────────────────────────────────────
function FrontierSky() {
  const stars = [
    [60,28],[140,16],[230,40],[310,12],[420,36],[510,20],[600,8],[690,34],
    [780,18],[870,42],[950,14],[1050,28],[1130,46],[120,58],[370,52],[640,56],
    [900,60],[1100,50],[190,78],[450,70],[720,76],[980,73],[80,90],[500,85],
    [800,88],[1000,82],[300,95],[700,92],
  ];
  const posts = Array.from({ length: 34 }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rdr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#04011a" />
          <stop offset="10%"  stopColor="#180830" />
          <stop offset="22%"  stopColor="#3e0e22" />
          <stop offset="34%"  stopColor="#8a1414" />
          <stop offset="46%"  stopColor="#c83510" />
          <stop offset="58%"  stopColor="#e06515" />
          <stop offset="70%"  stopColor="#f09525" />
          <stop offset="82%"  stopColor="#f8bc35" />
          <stop offset="92%"  stopColor="#f9d468" />
          <stop offset="100%" stopColor="#e8a845" />
        </linearGradient>
        <radialGradient id="rdr-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="18%"  stopColor="#fff7b0" />
          <stop offset="45%"  stopColor="#ffcc30" />
          <stop offset="100%" stopColor="#ff8010" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rdr-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffcc40" stopOpacity="0.65" />
          <stop offset="60%"  stopColor="#ff7010" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff4000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rdr-hf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e5230" />
          <stop offset="100%" stopColor="#0e2c1a" />
        </linearGradient>
        <linearGradient id="rdr-hn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#286838" />
          <stop offset="100%" stopColor="#163420" />
        </linearGradient>
        <linearGradient id="rdr-gnd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4a2010" />
          <stop offset="100%" stopColor="#1e0c04" />
        </linearGradient>
        <radialGradient id="rdr-vig" cx="50%" cy="50%" r="70%">
          <stop offset="40%"  stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.72)" />
        </radialGradient>
        <filter id="rdr-blur"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="1200" height="700" fill="url(#rdr-sky)" />

      {/* Stars */}
      {stars.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.7 + (i % 3) * 0.4} fill="#fff9e0" opacity={0.55 + (i % 5) * 0.08} />
      ))}

      {/* Sun halo */}
      <ellipse cx="600" cy="385" rx="260" ry="160" fill="url(#rdr-halo)" filter="url(#rdr-blur)" />
      {/* Sun disc */}
      <circle cx="600" cy="385" r="58" fill="url(#rdr-sun)" />
      <circle cx="600" cy="385" r="18" fill="rgba(255,255,245,1)" />

      {/* Horizon warm band */}
      <rect x="0" y="350" width="1200" height="80" fill="rgba(255,200,60,0.15)" />

      {/* Far hills — green silhouette */}
      <path
        d="M-10,440 C70,388 170,358 270,374 C350,386 430,392 510,368
           C590,344 680,336 760,356 C840,374 920,380 1000,358
           C1070,338 1140,350 1210,368 L1210,710 L-10,710 Z"
        fill="url(#rdr-hf)"
      />

      {/* Near hills */}
      <path
        d="M-10,498 C55,458 135,440 215,456 C295,472 375,480 455,460
           C535,440 615,430 700,448 C785,466 865,474 945,456
           C1025,438 1105,450 1210,465 L1210,710 L-10,710 Z"
        fill="url(#rdr-hn)"
      />

      {/* Far treeline */}
      <path
        d="M-10,462 C10,440 22,420 34,442 C46,420 58,402 70,424
           C82,402 96,384 110,408 C124,388 138,370 152,394 C164,374 178,358 194,380
           C208,360 224,344 240,368 C254,348 270,332 286,356 C300,336 316,320 332,344
           C348,324 364,308 380,332 C396,312 412,296 428,320 C444,300 460,286 476,310
           C492,290 508,276 525,300 C540,280 556,264 574,288 C588,268 604,254 622,278
           C636,258 652,244 670,268 C686,248 702,232 718,256 C734,238 750,224 768,248
           C782,228 798,214 816,238 C830,218 846,204 864,228 C880,210 896,196 912,220
           C928,202 944,186 962,210 C978,194 994,180 1010,204 C1026,186 1042,172 1060,196
           C1076,178 1092,164 1110,188 C1126,170 1142,156 1160,180 C1175,162 1190,150 1210,168
           L1210,710 L-10,710 Z"
        fill="#0c200e"
      />

      {/* Near trees — left cluster */}
      <path
        d="M-10,518 C14,488 34,466 54,488 C72,466 92,448 112,470
           C132,450 154,430 176,456 C196,434 218,414 240,440
           C260,418 280,400 300,426 L300,710 L-10,710 Z"
        fill="#071008"
      />

      {/* Near trees — right cluster */}
      <path
        d="M900,440 C924,418 944,400 964,422 C982,402 1002,384 1022,406
           C1042,384 1062,366 1084,390 C1102,368 1124,352 1144,376
           C1164,356 1182,340 1210,360 L1210,710 L900,710 Z"
        fill="#071008"
      />

      {/* Ground */}
      <rect x="0" y="590" width="1200" height="110" fill="url(#rdr-gnd)" />
      <rect x="0" y="588" width="1200" height="5" fill="rgba(200,120,40,0.22)" />

      {/* Fence rails */}
      <rect x="0" y="552" width="1200" height="5" rx="1" fill="#1e0e06" opacity="0.88" />
      <rect x="0" y="566" width="1200" height="4" rx="1" fill="#1e0e06" opacity="0.82" />

      {/* Fence posts */}
      {posts.map((i) => (
        <rect key={i} x={i * 36 + 4} y="540" width="8" height="42" rx="1" fill="#2c1408" opacity="0.92" />
      ))}

      {/* Vignette overlay */}
      <rect x="0" y="0" width="1200" height="700" fill="url(#rdr-vig)" />
      {/* Top + bottom letterbox */}
      <rect x="0" y="0"   width="1200" height="50" fill="rgba(0,0,0,0.52)" />
      <rect x="0" y="650" width="1200" height="50" fill="rgba(0,0,0,0.46)" />
    </svg>
  );
}

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

      {/* Name badge — wanted-poster style */}
      <div
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: 7,
          background: isYou
            ? "rgba(90, 38, 5, 0.92)"
            : "rgba(22, 12, 4, 0.90)",
          border: `2px solid ${
            isYou ? "#c85c10" : isDealer ? "#b8922a" : "rgba(140,80,25,0.5)"
          }`,
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
        background: "#04011a",
      }}
    >
      {/* SVG landscape — always visible */}
      <FrontierSky />

      {/* Table scene sits above the landscape */}
      <div style={{ perspective: "1100px", perspectiveOrigin: "50% 90%", position: "relative", zIndex: 2 }}>
        <div style={{ transform: tilt, transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)", transformStyle: "preserve-3d" }}>
          <div className="rdr-table">
            <div className="rdr-grain" />
            <div className="rdr-cracks" />
            <div className="rdr-felt">
              <div className="rdr-felt-inner" />

              {/* Community cards */}
              <div className="rdr-community">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Card key={i} card={community[i] || null} faceUp={community[i] != null} />
                ))}
              </div>

              {/* Pot */}
              {pot > 0 && <div className="rdr-pot">POT: {pot}</div>}

              {/* Dealer button */}
              <div className="rdr-dealer-wrap">
                <div className="rdr-dealer-btn">D</div>
              </div>

              {/* Seats */}
              {players.map((p) => (
                <CountrySeat key={p.id} player={p} dealerPeeking={dealerPeeking} isDealerView={isDealerView} />
              ))}

              {/* Peek hint */}
              {peekHint && <div className="peek-hint">DEALER IS PEEKING!</div>}
            </div>
            <div className="rdr-table-shadow" />
          </div>
        </div>
      </div>

      {/* Venue watermark */}
      <div
        style={{
          position: "absolute", bottom: 16, right: 20,
          fontFamily: '"Press Start 2P", monospace', fontSize: 7,
          color: "rgba(240,180,70,0.35)", letterSpacing: "0.14em",
          zIndex: 3, pointerEvents: "none", textTransform: "uppercase",
        }}
      >
        Frontier · Sundown
      </div>
    </div>
  );
}
