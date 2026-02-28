// Card.jsx – 3-D flip card with peek (tilt) animation
export default function Card({ card, faceUp = false, peeking = false }) {
  if (!card) {
    // placeholder / empty slot
    return (
      <div
        style={{
          width: 52,
          height: 74,
          border: "2px dashed rgba(255,255,255,0.15)",
          borderRadius: 6,
        }}
      />
    );
  }

  const suitClass = card.red ? "red-suit" : "black-suit";

  return (
    <div
      className={`card-wrap ${faceUp ? "face-up" : "face-down"} ${
        peeking ? "peeking" : ""
      }`}
    >
      <div className="card-inner">
        {/* Front */}
        <div className="card-face">
          <div className={suitClass} style={{ fontSize: 12, fontWeight: 700 }}>
            <div>{card.rank}</div>
            <div style={{ fontSize: 10 }}>{card.suit}</div>
          </div>
          <div
            className={suitClass}
            style={{
              alignSelf: "flex-end",
              transform: "rotate(180deg)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <div>{card.rank}</div>
            <div style={{ fontSize: 10 }}>{card.suit}</div>
          </div>
        </div>
        {/* Back */}
        <div className="card-back" />
      </div>
    </div>
  );
}
