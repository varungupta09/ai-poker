import { useEffect, useRef, useState } from "react";

// Each figure is a simple SVG silhouette. We scatter them in an elliptical arc
// around the table, varying heights/scales for depth.

const CROWD_SIZE = 28;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

// Generate stable crowd data once
function generateCrowd() {
  return Array.from({ length: CROWD_SIZE }, (_, i) => {
    const angle = (i / CROWD_SIZE) * 2 * Math.PI;
    // Elliptical ring
    const rx = 510;
    const ry = 295;
    const x = 50 + (rx * Math.cos(angle)) / 10.5; // percent of scene width
    const y = 50 + (ry * Math.sin(angle)) / 7;
    const scale = randomBetween(0.7, 1.3);
    const delay = randomBetween(0, 2.4);
    const speed = randomBetween(1.6, 3.2);
    const row = Math.abs(Math.sin(angle)) > 0.5 ? 1 : 0; // back rows slightly darker
    return { id: i, x, y, scale, delay, speed, row, angle };
  });
}

const CROWD = generateCrowd();

// Silhouette path (head + shoulders blob)
function SilhouetteSVG({ color, wobble }) {
  return (
    <svg
      width="32"
      height="52"
      viewBox="0 0 32 52"
      fill="none"
      style={{ display: "block", animation: `bob ${wobble}s ease-in-out infinite alternate` }}
    >
      {/* head */}
      <ellipse cx="16" cy="11" rx="8" ry="9" fill={color} />
      {/* shoulders / body */}
      <path
        d="M2 52 C2 34 6 28 16 26 C26 28 30 34 30 52 Z"
        fill={color}
      />
    </svg>
  );
}

// Reaction bubble
function Bubble({ text, x, y }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -120%)",
        background: "rgba(0,0,0,0.85)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 6,
        padding: "3px 8px",
        fontSize: 9,
        fontFamily: '"Press Start 2P", monospace',
        color: "#ffd700",
        whiteSpace: "nowrap",
        animation: "bubbleUp 2.2s ease forwards",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {text}
    </div>
  );
}

const REACTIONS = ["WOAH!", "NICE!", "OOF!", "RAISE!", "BET!", "GG!", "FOLD!", "ALL IN?", "👀", "🔥"];

export default function Crowd({ trigger }) {
  const [bubbles, setBubbles] = useState([]);
  const timerRef = useRef(null);

  // Spawn bubbles whenever trigger fires
  useEffect(() => {
    if (!trigger) return;

    const count = 3 + Math.floor(Math.random() * 4);
    const picks = [...CROWD]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    const newBubbles = picks.map((c) => ({
      id: Date.now() + c.id,
      text: REACTIONS[Math.floor(Math.random() * REACTIONS.length)],
      x: c.x,
      y: c.y,
    }));

    setBubbles((b) => [...b, ...newBubbles]);
    timerRef.current = setTimeout(() => {
      setBubbles((b) => b.filter((bb) => !newBubbles.find((n) => n.id === bb.id)));
    }, 2400);

    return () => clearTimeout(timerRef.current);
  }, [trigger]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {CROWD.map((c) => {
        const isBack = c.row === 0;
        const color = isBack
          ? `rgba(${20 + Math.floor(Math.random() * 30)}, ${10 + Math.floor(Math.random() * 20)}, ${10 + Math.floor(Math.random() * 20)}, 0.55)`
          : `rgba(${35 + Math.floor(Math.random() * 40)}, ${15 + Math.floor(Math.random() * 25)}, ${15 + Math.floor(Math.random() * 25)}, 0.75)`;

        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: `translate(-50%, -50%) scale(${c.scale})`,
              zIndex: 0,
            }}
          >
            <SilhouetteSVG color={color} wobble={c.speed} />
          </div>
        );
      })}

      {bubbles.map((b) => (
        <Bubble key={b.id} text={b.text} x={b.x} y={b.y} />
      ))}

      {/* Keyframes injected inline for bobbing + bubble animations */}
      <style>{`
        @keyframes bob {
          from { transform: translateY(0px);  }
          to   { transform: translateY(-5px); }
        }
        @keyframes bubbleUp {
          0%   { opacity: 0; transform: translate(-50%, -110%); }
          15%  { opacity: 1; transform: translate(-50%, -130%); }
          75%  { opacity: 1; transform: translate(-50%, -140%); }
          100% { opacity: 0; transform: translate(-50%, -160%); }
        }
      `}</style>
    </div>
  );
}
