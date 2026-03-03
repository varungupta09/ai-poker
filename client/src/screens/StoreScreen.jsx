import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

// ─── Store Data ───────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Venues", "Chip Sets", "Card Backs", "Table Felt", "Avatars"];

const STORE_ITEMS = [
  // Venues
  {
    id: "v1", category: "Venues", name: "Neon City Arena",
    description: "A glowing cyberpunk coliseum with LED ropes and electric crowds.",
    price: 600, emoji: "🌆",
    bg: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
    accent: "#818cf8", tag: "Popular",
  },
  {
    id: "v2", category: "Venues", name: "Casino Royale",
    description: "Black-tie elegance. Marble floors, chandeliers, and velvet curtains.",
    price: 750, emoji: "🎰",
    bg: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
    accent: "#fbbf24", tag: "Exclusive",
  },
  {
    id: "v3", category: "Venues", name: "Wild West Saloon",
    description: "Sawdust on the floor, whiskey on the table. High noon poker.",
    price: 400, emoji: "🤠",
    bg: "linear-gradient(135deg,#451a03,#78350f,#92400e)",
    accent: "#fb923c", tag: null,
  },
  {
    id: "v4", category: "Venues", name: "Monte Carlo Terrace",
    description: "Mediterranean cliffs, sea breeze, and millionaire vibes.",
    price: 900, emoji: "🌊",
    bg: "linear-gradient(135deg,#042f2e,#065f46,#0f766e)",
    accent: "#34d399", tag: "New",
  },
  {
    id: "v5", category: "Venues", name: "Space Station",
    description: "Zero gravity poker above Earth. Stars for a backdrop.",
    price: 1100, emoji: "🚀",
    bg: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
    accent: "#a78bfa", tag: "Premium",
  },
  {
    id: "v6", category: "Venues", name: "Tokyo Rooftop",
    description: "Rain on glass, city lights below. Late-night high-stakes.",
    price: 500, emoji: "🗼",
    bg: "linear-gradient(135deg,#0c0a09,#1c1917,#292524)",
    accent: "#f43f5e", tag: null,
  },

  // Chip Sets
  {
    id: "c1", category: "Chip Sets", name: "Vegas Gold",
    description: "Heavy clay chips with gold inlay. The real deal.",
    price: 280, emoji: "🥇",
    bg: "linear-gradient(135deg,#78350f,#b45309,#d97706)",
    accent: "#fde68a", tag: "Popular",
  },
  {
    id: "c2", category: "Chip Sets", name: "Midnight Blue",
    description: "Deep navy chips that shimmer under table lights.",
    price: 220, emoji: "💎",
    bg: "linear-gradient(135deg,#1e3a8a,#1d4ed8,#2563eb)",
    accent: "#93c5fd", tag: null,
  },
  {
    id: "c3", category: "Chip Sets", name: "Crimson Elite",
    description: "Blood-red ceramic chips. Show them who's in charge.",
    price: 340, emoji: "🔴",
    bg: "linear-gradient(135deg,#7f1d1d,#b91c1c,#dc2626)",
    accent: "#fca5a5", tag: "Exclusive",
  },
  {
    id: "c4", category: "Chip Sets", name: "Diamond Crystal",
    description: "Clear acrylic chips that catch every light in the room.",
    price: 480, emoji: "💠",
    bg: "linear-gradient(135deg,#164e63,#0e7490,#06b6d4)",
    accent: "#a5f3fc", tag: "Premium",
  },
  {
    id: "c5", category: "Chip Sets", name: "Emerald Pro",
    description: "Tournament-grade green chips favored by the top 1%.",
    price: 320, emoji: "💚",
    bg: "linear-gradient(135deg,#14532d,#15803d,#16a34a)",
    accent: "#86efac", tag: "New",
  },
  {
    id: "c6", category: "Chip Sets", name: "Rose Gold",
    description: "Soft metallic finish. Elegant and ruthless.",
    price: 260, emoji: "🌸",
    bg: "linear-gradient(135deg,#881337,#be123c,#e11d48)",
    accent: "#fda4af", tag: null,
  },

  // Card Backs
  {
    id: "b1", category: "Card Backs", name: "Royal Blue",
    description: "Classic Bicycle-style blue linen back. Clean and sharp.",
    price: 150, emoji: "🃏",
    bg: "linear-gradient(135deg,#172554,#1e3a8a,#1d4ed8)",
    accent: "#bfdbfe", tag: "Popular",
  },
  {
    id: "b2", category: "Card Backs", name: "Gold Foil",
    description: "Embossed gold pattern. Turns heads on every deal.",
    price: 350, emoji: "✨",
    bg: "linear-gradient(135deg,#451a03,#92400e,#b45309)",
    accent: "#fcd34d", tag: "Exclusive",
  },
  {
    id: "b3", category: "Card Backs", name: "Holographic",
    description: "Rainbow prismatic finish that shifts with the light.",
    price: 550, emoji: "🌈",
    bg: "linear-gradient(135deg,#581c87,#7c3aed,#8b5cf6)",
    accent: "#e9d5ff", tag: "Premium",
  },
  {
    id: "b4", category: "Card Backs", name: "Black Obsidian",
    description: "Matte black with a subtle geometric pattern.",
    price: 200, emoji: "🖤",
    bg: "linear-gradient(135deg,#0c0a09,#1c1917,#292524)",
    accent: "#a8a29e", tag: null,
  },
  {
    id: "b5", category: "Card Backs", name: "Samurai Pattern",
    description: "Japanese wave art on deep crimson. Feel the honor.",
    price: 420, emoji: "⚔️",
    bg: "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)",
    accent: "#fca5a5", tag: "New",
  },

  // Table Felt
  {
    id: "f1", category: "Table Felt", name: "Classic Casino Green",
    description: "The timeless Vegas felt. Soft and classic.",
    price: 100, emoji: "🟢",
    bg: "linear-gradient(135deg,#14532d,#166534,#15803d)",
    accent: "#86efac", tag: "Popular",
  },
  {
    id: "f2", category: "Table Felt", name: "Royal Red",
    description: "Deep crimson felt. High drama, high stakes.",
    price: 180, emoji: "🔴",
    bg: "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)",
    accent: "#fca5a5", tag: null,
  },
  {
    id: "f3", category: "Table Felt", name: "Midnight Navy",
    description: "Dark ocean blue felt with silver stitching.",
    price: 220, emoji: "🌙",
    bg: "linear-gradient(135deg,#172554,#1e3a8a,#1e40af)",
    accent: "#bfdbfe", tag: null,
  },
  {
    id: "f4", category: "Table Felt", name: "Black Velvet",
    description: "Pure black premium velvet. The VIP treatment.",
    price: 350, emoji: "🖤",
    bg: "linear-gradient(135deg,#0a0a0a,#171717,#262626)",
    accent: "#a3a3a3", tag: "Exclusive",
  },
  {
    id: "f5", category: "Table Felt", name: "Purple Royale",
    description: "Silky purple felt found in the highest roller rooms.",
    price: 280, emoji: "💜",
    bg: "linear-gradient(135deg,#3b0764,#6b21a8,#7e22ce)",
    accent: "#d8b4fe", tag: "New",
  },

  // Avatars
  {
    id: "a1", category: "Avatars", name: "Cyber Bot",
    description: "Chrome and neon circuits. Built for the digital arena.",
    price: 320, emoji: "🤖",
    bg: "linear-gradient(135deg,#0f172a,#1e293b,#334155)",
    accent: "#38bdf8", tag: "Popular",
  },
  {
    id: "a2", category: "Avatars", name: "Ghost",
    description: "Spectral and mysterious. Nobody reads a ghost.",
    price: 290, emoji: "👻",
    bg: "linear-gradient(135deg,#1f2937,#374151,#4b5563)",
    accent: "#d1d5db", tag: null,
  },
  {
    id: "a3", category: "Avatars", name: "Dragon",
    description: "Ancient power. Your opponents will fear the fold.",
    price: 580, emoji: "🐉",
    bg: "linear-gradient(135deg,#14532d,#166534,#15803d)",
    accent: "#4ade80", tag: "Premium",
  },
  {
    id: "a4", category: "Avatars", name: "Skull King",
    description: "Crowned skeleton. Death folds to no one.",
    price: 650, emoji: "💀",
    bg: "linear-gradient(135deg,#0c0a09,#1c1917,#44403c)",
    accent: "#e7e5e4", tag: "Exclusive",
  },
  {
    id: "a5", category: "Avatars", name: "Phoenix",
    description: "Rise from bad beats. The chip leader reborn.",
    price: 480, emoji: "🔥",
    bg: "linear-gradient(135deg,#7c2d12,#c2410c,#ea580c)",
    accent: "#fdba74", tag: "New",
  },
  {
    id: "a6", category: "Avatars", name: "Diamond Fox",
    description: "Quick, clever, and impossible to read.",
    price: 390, emoji: "🦊",
    bg: "linear-gradient(135deg,#78350f,#b45309,#ca8a04)",
    accent: "#fde68a", tag: null,
  },
];

const FEATURED = {
  id: "featured_v5",
  name: "Space Station",
  description: "Compete above the clouds. Zero gravity poker with Earth as your backdrop. The most immersive venue in the arena — reserved for those who reach for the stars.",
  price: 1100,
  emoji: "🚀",
  bg: "linear-gradient(135deg,#020617,#0f172a,#1e1b4b)",
  accent: "#a78bfa",
  tag: "Premium",
};

// ─── Components ───────────────────────────────────────────────────────────────

function FeaturedBanner({ item, coins, onBuy }) {
  const canAfford = coins >= item.price;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        overflow: "hidden",
        padding: "40px 48px",
        background: item.bg,
        border: "1px solid rgba(167,139,250,0.2)",
        display: "flex",
        alignItems: "center",
        gap: 48,
        marginBottom: 48,
        boxShadow: `0 0 60px ${item.accent}22`,
      }}
    >
      {/* Background star pattern */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      {/* Tag */}
      {item.tag && (
        <div style={{
          position: "absolute", top: 20, right: 20,
          background: `${item.accent}22`,
          border: `1px solid ${item.accent}44`,
          color: item.accent,
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 8,
          padding: "6px 12px",
          borderRadius: 20,
        }}>{item.tag.toUpperCase()}</div>
      )}

      {/* Emoji */}
      <div style={{
        fontSize: 96, lineHeight: 1, flexShrink: 0,
        filter: "drop-shadow(0 0 32px rgba(167,139,250,0.5))",
      }}>
        {item.emoji}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          color: item.accent,
          marginBottom: 12,
          letterSpacing: "0.1em",
        }}>FEATURED THIS WEEK</div>
        <h2 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          color: "#fff",
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}>{item.name}</h2>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          margin: "0 0 24px",
          lineHeight: 1.6,
          maxWidth: 500,
        }}>{item.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => onBuy(item)}
            style={{
              background: canAfford
                ? `linear-gradient(135deg,${item.accent},${item.accent}cc)`
                : "rgba(255,255,255,0.08)",
              border: canAfford ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: canAfford ? "#000" : "rgba(255,255,255,0.3)",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: "14px 28px",
              borderRadius: 10,
              cursor: canAfford ? "pointer" : "not-allowed",
              fontWeight: 700,
              transition: "opacity 0.15s",
            }}
          >
            {canAfford ? `BUY — ${item.price.toLocaleString()} 💎` : `${item.price.toLocaleString()} 💎 — NOT ENOUGH`}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreItem({ item, coins, onBuy, owned }) {
  const canAfford = coins >= item.price;

  return (
    <div
      style={{
        background: "#111",
        border: owned
          ? "1px solid rgba(74,222,128,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s, transform 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        if (!owned) e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = owned ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.07)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Visual */}
      <div style={{
        height: 120,
        background: item.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 52,
        position: "relative",
        flexShrink: 0,
      }}>
        {item.emoji}
        {item.tag && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: `${item.accent}33`,
            border: `1px solid ${item.accent}55`,
            color: item.accent,
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            padding: "4px 8px",
            borderRadius: 20,
          }}>{item.tag.toUpperCase()}</div>
        )}
        {owned && (
          <div style={{
            position: "absolute", top: 10, left: 10,
            background: "rgba(74,222,128,0.2)",
            border: "1px solid rgba(74,222,128,0.5)",
            color: "#4ade80",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 7,
            padding: "4px 8px",
            borderRadius: 20,
          }}>OWNED</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "16px 16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 7,
          color: item.accent,
          marginBottom: 6,
          letterSpacing: "0.05em",
        }}>{item.category.toUpperCase()}</div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
        }}>{item.name}</div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.5,
          flex: 1,
          marginBottom: 16,
        }}>{item.description}</div>

        <button
          onClick={() => !owned && onBuy(item)}
          disabled={owned || !canAfford}
          style={{
            background: owned
              ? "rgba(74,222,128,0.1)"
              : canAfford
              ? "linear-gradient(135deg,#e01b2d,#991b1b)"
              : "rgba(255,255,255,0.05)",
            border: owned
              ? "1px solid rgba(74,222,128,0.3)"
              : canAfford
              ? "none"
              : "1px solid rgba(255,255,255,0.08)",
            color: owned
              ? "#4ade80"
              : canAfford
              ? "#fff"
              : "rgba(255,255,255,0.25)",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 8,
            padding: "11px 0",
            borderRadius: 8,
            cursor: owned || !canAfford ? "not-allowed" : "pointer",
            width: "100%",
            transition: "opacity 0.15s",
          }}
        >
          {owned ? "✓ OWNED" : canAfford ? `${item.price.toLocaleString()} 💎` : `${item.price.toLocaleString()} 💎`}
        </button>
      </div>
    </div>
  );
}

// Maps category label → items{} key stored in DB
const CATEGORY_KEY = {
  "Venues":     "venue",
  "Chip Sets":  "chip_set",
  "Card Backs": "card_back",
  "Table Felt": "table_felt",
  "Avatars":    "avatar",
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StoreScreen({ setScreen, user }) {
  const [activeTab, setActiveTab]   = useState("All");
  const [coins, setCoins]           = useState(null);
  const [owned, setOwned]           = useState(new Set());
  const [itemsRecord, setItemsRecord] = useState({});
  const [toast, setToast]           = useState(null);

  // Fetch gems + items from user_profiles
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_profiles")
      .select("gems, items")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.gems != null) setCoins(data.gems);
        if (data?.items && typeof data.items === "object") {
          setItemsRecord(data.items);
          // Rebuild owned set from stored items
          const ownedIds = new Set();
          Object.entries(data.items).forEach(([key, name]) => {
            const match = STORE_ITEMS.find(
              (i) => CATEGORY_KEY[i.category] === key && i.name === name
            );
            if (match) ownedIds.add(match.id);
          });
          setOwned(ownedIds);
        }
      });
  }, [user?.id]);

  const filtered = activeTab === "All"
    ? STORE_ITEMS
    : STORE_ITEMS.filter((i) => i.category === activeTab);

  async function handleBuy(item) {
    if (owned.has(item.id) || coins == null || coins < item.price) return;
    const newGems    = coins - item.price;
    const key        = CATEGORY_KEY[item.category];
    const newItems   = { ...itemsRecord, [key]: item.name };

    // Optimistic update
    setCoins(newGems);
    setOwned((prev) => new Set([...prev, item.id]));
    setItemsRecord(newItems);
    setToast(`${item.name} unlocked!`);
    setTimeout(() => setToast(null), 2800);

    if (user?.id) {
      await supabase
        .from("user_profiles")
        .update({ gems: newGems, items: newItems })
        .eq("id", user.id);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#14532d,#15803d)",
          border: "1px solid rgba(74,222,128,0.4)",
          color: "#4ade80",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 9,
          padding: "14px 28px",
          borderRadius: 12,
          zIndex: 1000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.2s ease",
          whiteSpace: "nowrap",
        }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 32px",
          height: 68,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}>
          <button
            onClick={() => setScreen("home")}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ← Back
          </button>

          <div style={{ flex: 1 }}>
            <span style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 14,
              color: "#fff",
              letterSpacing: "0.05em",
            }}>STORE</span>
          </div>

          {user ? (
            <>
              {/* Balance */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 10,
                padding: "8px 16px",
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Gems</span>
                <span style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 12,
                  color: "#fbbf24",
                }}>
                  {coins == null ? "..." : coins.toLocaleString()} 💎
                </span>
              </div>

              <button
                onClick={() => setScreen("play")}
                style={{
                  background: "linear-gradient(135deg,#e01b2d,#991b1b)",
                  border: "none",
                  color: "#fff",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                + EARN GEMS
              </button>
            </>
          ) : (
            <button
              onClick={() => setScreen("login")}
              style={{
                background: "linear-gradient(135deg,#e01b2d,#991b1b)",
                border: "none",
                color: "#fff",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              LOG IN
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 80px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 38,
            fontWeight: 800,
            color: "#fff",
            margin: "0 0 8px",
          }}>Cosmetics Store</h1>
          <p style={{
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
            margin: 0,
          }}>Unlock venues, chip sets, card backs, and more. New drops every Friday.</p>
        </div>

        {/* Featured item */}
        <FeaturedBanner item={FEATURED} coins={coins} onBuy={handleBuy} />

        {/* Category tabs */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 32,
          paddingBottom: 20,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexWrap: "wrap",
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                background: activeTab === cat
                  ? "linear-gradient(135deg,#e01b2d,#991b1b)"
                  : "rgba(255,255,255,0.05)",
                border: activeTab === cat
                  ? "none"
                  : "1px solid rgba(255,255,255,0.1)",
                color: activeTab === cat ? "#fff" : "rgba(255,255,255,0.55)",
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 8,
                padding: "10px 18px",
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <span style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Press Start 2P', monospace",
            }}>
              {filtered.length} ITEMS
            </span>
          </div>
        </div>

        {/* Category header */}
        {activeTab !== "All" && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              margin: 0,
            }}>{activeTab}</h2>
          </div>
        )}

        {/* Items grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {filtered.map((item) => (
            <StoreItem
              key={item.id}
              item={item}
              coins={coins}
              onBuy={handleBuy}
              owned={owned.has(item.id)}
            />
          ))}
        </div>

        {/* Bottom callout */}
        <div style={{
          marginTop: 64,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "32px 40px",
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}>
          <div style={{ fontSize: 48 }}>💎</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 11,
              color: "#fbbf24",
              marginBottom: 8,
            }}>EARN MORE GEMS</div>
            <p style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.55)",
              margin: "0 0 4px",
            }}>Win matches to earn gems. Higher ELO opponents give bigger gem rewards.</p>
            <p style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              margin: 0,
            }}>Daily bonus: +50 💎 &nbsp;·&nbsp; Win streak bonus: up to +200 💎 &nbsp;·&nbsp; Tournament win: +1,000 💎</p>
          </div>
          <button
            onClick={() => setScreen("play")}
            style={{
              background: "linear-gradient(135deg,#e01b2d,#991b1b)",
              border: "none",
              color: "#fff",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 9,
              padding: "14px 28px",
              borderRadius: 10,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            PLAY NOW
          </button>
        </div>
      </div>
    </div>
  );
}
