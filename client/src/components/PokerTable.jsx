// PokerTable.jsx – oval felt table with positioned player seats
import Card from "./Card.jsx";

// Position offsets on the felt (% of width/height from center)
const SEAT_POSITIONS = {
  bottom: { left: "50%",  top: "88%"  },
  top:    { left: "50%",  top: "12%"  },
  left:   { left: "10%",  top: "50%"  },
  right:  { left: "90%",  top: "50%"  },
};

// Where chips appear on the felt (between seat and pot center)
const BET_POSITIONS = {
  bottom: { left: "50%",  top: "70%" },
  top:    { left: "50%",  top: "30%" },
  left:   { left: "26%",  top: "50%" },
  right:  { left: "74%",  top: "50%" },
};

const CHIP_COLORS = ["#e01b2d", "#1a6fe8", "#1db954", "#ffd700", "#9b59b6"];

function BetChipStack({ amount, position }) {
  if (!amount || amount <= 0) return null;
  const pos = BET_POSITIONS[position];

  // Number of visible chip circles (1–5)
  const count = Math.min(5, Math.ceil(amount / 60) + 1);
  const color = CHIP_COLORS[Math.floor(amount / 50) % CHIP_COLORS.length];

  return (
    <div className="bet-stack" style={{ left: pos.left, top: pos.top }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bet-chip"
          style={{
            background: color,
            bottom: i * 5,
            boxShadow: `0 ${2 + i}px 0 rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
        />
      ))}
      <span className="bet-amount">{amount}</span>
    </div>
  );
}

function Seat({ player, cardVisibility, dealerPeeking, isDealerView, showAllCards, isWinner }) {
  const pos = SEAT_POSITIONS[player.position];

  // Determine face-up logic per card
  // "you" → always face-up for your own cards
  // any seat in dealer-view → face-up (you're sitting in the dealer's chair)
  // showAllCards → simulation mode, all cards visible
  // dealer seat with peeking → peeking animation
  const isYou = player.id === "you";
  const isDealer = player.id === "dealer";
  const isFolded = player.folded;

  function cardProps(index) {
    if (isFolded) return { faceUp: false, peeking: false, folded: true };
    if (showAllCards) return { faceUp: true, peeking: false };
    if (isYou) return { faceUp: true, peeking: false };
    if (isDealerView) return { faceUp: true, peeking: false };
    if (isDealer && dealerPeeking) return { faceUp: true, peeking: true };
    return { faceUp: false, peeking: false };
  }

  return (
    <div 
      className={`seat ${isFolded ? "folded" : ""} ${isWinner ? "winner" : ""}`} 
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="cards-row">
        {player.cards.length > 0
          ? player.cards.map((c, i) => (
              <Card key={i} card={c} {...cardProps(i)} />
            ))
          : // empty placeholders before deal
            [0, 1].map((i) => <Card key={i} card={null} />)}
      </div>

      <div className={`seat-label ${isYou ? "is-you" : isDealer ? "is-dealer" : ""} ${isFolded ? "folded" : ""} ${isWinner ? "winner" : ""}`}>
        {player.name}
        {isDealer && <span style={{ marginLeft: 4 }}>🃏</span>}
        {isFolded && <span style={{ marginLeft: 4 }}>🏳️</span>}
        {isWinner && <span style={{ marginLeft: 4 }}>🏆</span>}
      </div>
      {player.chips != null && (
        <div className={`seat-chips ${isFolded ? "folded" : ""}`}>{player.chips} chips</div>
      )}
    </div>
  );
}

export default function PokerTable({
  view,
  players,
  community,
  dealerPeeking,
  pot,
  peekHint,
  showAllCards = false,
  highlightWinner = null,
  bets = {},
}) {
  const isDealerView = view === "dealer";

  return (
    <div className={`scene ${view === "dealer" ? "view-dealer" : view === "topdown" ? "view-topdown" : "view-player"}`}>
      <div className="table-wrap">
        <div className="felt">
          <div className="felt-inner" />

          {/* Community cards */}
          <div className="community">
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
            <div className="pot-label">POT: {pot}</div>
          )}

          {/* Dealer button (D chip) next to dealer seat */}
          <div
            style={{
              position: "absolute",
              left: "calc(50% + 30px)",
              top: "calc(12% + 10px)",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="dealer-btn">D</div>
          </div>

          {/* Player seats */}
          {players.map((p) => (
            <Seat
              key={p.id}
              player={p}
              dealerPeeking={dealerPeeking}
              isDealerView={isDealerView}
              showAllCards={showAllCards}
              isWinner={highlightWinner === p.id}
            />
          ))}

          {/* Bet chip stacks on the felt */}
          {players.filter(p => p.id !== "dealer").map((p) => (
            <BetChipStack
              key={p.id}
              amount={bets[p.id]}
              position={p.position}
            />
          ))}

          {/* Peek hint overlay */}
          {peekHint && (
            <div className="peek-hint">DEALER IS PEEKING!</div>
          )}
        </div>
      </div>
    </div>
  );
}
