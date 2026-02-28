// PokerTable.jsx – oval felt table with positioned player seats
import Card from "./Card.jsx";

// Position offsets on the felt (% of width/height from center)
const SEAT_POSITIONS = {
  bottom: { left: "50%",  top: "88%"  },
  top:    { left: "50%",  top: "12%"  },
  left:   { left: "10%",  top: "50%"  },
  right:  { left: "90%",  top: "50%"  },
};

function Seat({ player, cardVisibility, dealerPeeking, isDealerView }) {
  const pos = SEAT_POSITIONS[player.position];

  // Determine face-up logic per card
  // "you" → always face-up for your own cards
  // any seat in dealer-view → face-up (you're sitting in the dealer's chair)
  // dealer seat with peeking → peeking animation
  const isYou = player.id === "you";
  const isDealer = player.id === "dealer";

  function cardProps(index) {
    if (isYou) return { faceUp: true, peeking: false };
    if (isDealerView) return { faceUp: true, peeking: false };
    if (isDealer && dealerPeeking) return { faceUp: true, peeking: true };
    return { faceUp: false, peeking: false };
  }

  return (
    <div className="seat" style={{ left: pos.left, top: pos.top }}>
      <div className="cards-row">
        {player.cards.length > 0
          ? player.cards.map((c, i) => (
              <Card key={i} card={c} {...cardProps(i)} />
            ))
          : // empty placeholders before deal
            [0, 1].map((i) => <Card key={i} card={null} />)}
      </div>

      <div className={`seat-label ${isYou ? "is-you" : isDealer ? "is-dealer" : ""}`}>
        {player.name}
        {isDealer && <span style={{ marginLeft: 4 }}>🃏</span>}
      </div>
      {player.chips != null && (
        <div className="seat-chips">{player.chips} chips</div>
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
