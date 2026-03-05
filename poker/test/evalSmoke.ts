import { evaluate7, compareHands } from "../handEvaluator"
import { Card, HandRank, Rank, Suit } from "../types"

function c(rank: Rank, suit: Suit): Card { return { rank, suit } }

let passed = 0
let failed = 0

function check(label: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`✓ ${label}`, extra ?? "")
    passed++
  } else {
    console.error(`✗ ${label}`, extra ?? "")
    failed++
  }
}

// Straight Flush / Royal Flush
const rf = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Spades), c(Rank.Queen, Suit.Spades),
  c(Rank.Jack, Suit.Spades), c(Rank.Ten, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Hearts),
])
check("StraightFlush (Royal)", rf.rank === HandRank.StraightFlush && rf.tiebreakers[0] === Rank.Ace, rf.tiebreakers)

// Regular Straight Flush
const sf = evaluate7([
  c(Rank.Nine, Suit.Hearts), c(Rank.Eight, Suit.Hearts), c(Rank.Seven, Suit.Hearts),
  c(Rank.Six, Suit.Hearts), c(Rank.Five, Suit.Hearts), c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Clubs),
])
check("StraightFlush (9-high)", sf.rank === HandRank.StraightFlush && sf.tiebreakers[0] === Rank.Nine, sf.tiebreakers)

// Four of a Kind
const foak = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.Ace, Suit.Clubs), c(Rank.Ace, Suit.Diamonds),
  c(Rank.King, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
check("FourOfAKind", foak.rank === HandRank.FourOfAKind, foak.tiebreakers)

// Full House
const fh = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.Ace, Suit.Clubs),
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.Two, Suit.Clubs), c(Rank.Three, Suit.Diamonds),
])
check("FullHouse", fh.rank === HandRank.FullHouse && fh.tiebreakers[0] === Rank.Ace && fh.tiebreakers[1] === Rank.King, fh.tiebreakers)

// Full house: two sets of trips
const fh2trips = evaluate7([
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.King, Suit.Clubs),
  c(Rank.Eight, Suit.Spades), c(Rank.Eight, Suit.Hearts), c(Rank.Eight, Suit.Clubs), c(Rank.Two, Suit.Diamonds),
])
check("FullHouse (two trips)", fh2trips.rank === HandRank.FullHouse && fh2trips.tiebreakers[0] === Rank.King && fh2trips.tiebreakers[1] === Rank.Eight, fh2trips.tiebreakers)

// Flush
const fl = evaluate7([
  c(Rank.Ace, Suit.Hearts), c(Rank.Jack, Suit.Hearts), c(Rank.Nine, Suit.Hearts),
  c(Rank.Six, Suit.Hearts), c(Rank.Three, Suit.Hearts), c(Rank.King, Suit.Spades), c(Rank.Two, Suit.Clubs),
])
check("Flush", fl.rank === HandRank.Flush && fl.tiebreakers[0] === Rank.Ace, fl.tiebreakers)

// Straight (normal)
const st = evaluate7([
  c(Rank.Nine, Suit.Spades), c(Rank.Eight, Suit.Hearts), c(Rank.Seven, Suit.Clubs),
  c(Rank.Six, Suit.Diamonds), c(Rank.Five, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.King, Suit.Clubs),
])
check("Straight (9-high)", st.rank === HandRank.Straight && st.tiebreakers[0] === Rank.Nine, st.tiebreakers)

// Straight — wheel (A-2-3-4-5)
const wheelCards: Card[] = [
  c(Rank.Ace, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
  c(Rank.Four, Suit.Diamonds), c(Rank.Five, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.Seven, Suit.Clubs),
]
const wheel = evaluate7(wheelCards)
check("Straight (wheel A-2-3-4-5, top=5)", wheel.rank === HandRank.Straight && wheel.tiebreakers[0] === Rank.Five, wheel.tiebreakers)

// Three of a Kind
const toak = evaluate7([
  c(Rank.Queen, Suit.Spades), c(Rank.Queen, Suit.Hearts), c(Rank.Queen, Suit.Clubs),
  c(Rank.Ace, Suit.Diamonds), c(Rank.King, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
check("ThreeOfAKind", toak.rank === HandRank.ThreeOfAKind && toak.tiebreakers[0] === Rank.Queen, toak.tiebreakers)

// Two Pair
const tp = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts),
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts),
  c(Rank.Two, Suit.Clubs), c(Rank.Three, Suit.Diamonds), c(Rank.Four, Suit.Spades),
])
check("TwoPair", tp.rank === HandRank.TwoPair && tp.tiebreakers[0] === Rank.Ace && tp.tiebreakers[1] === Rank.King, tp.tiebreakers)

// Two Pair — 3 pairs in hand, picks top 2
const tp3 = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts),
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts),
  c(Rank.Queen, Suit.Clubs), c(Rank.Queen, Suit.Diamonds), c(Rank.Two, Suit.Spades),
])
check("TwoPair (3 pairs, picks best 2)", tp3.rank === HandRank.TwoPair && tp3.tiebreakers[0] === Rank.Ace && tp3.tiebreakers[1] === Rank.King && tp3.tiebreakers[2] === Rank.Queen, tp3.tiebreakers)

// One Pair
const op = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts),
  c(Rank.King, Suit.Clubs), c(Rank.Jack, Suit.Diamonds), c(Rank.Nine, Suit.Spades),
  c(Rank.Three, Suit.Hearts), c(Rank.Two, Suit.Clubs),
])
check("OnePair", op.rank === HandRank.OnePair && op.tiebreakers[0] === Rank.Ace, op.tiebreakers)

// High Card
const hc = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Hearts), c(Rank.Jack, Suit.Clubs),
  c(Rank.Nine, Suit.Diamonds), c(Rank.Seven, Suit.Spades), c(Rank.Five, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
check("HighCard", hc.rank === HandRank.HighCard && hc.tiebreakers[0] === Rank.Ace, hc.tiebreakers)

// compareHands: StraightFlush beats FourOfAKind
check("compareHands: SF > FOAK", compareHands(rf, foak) === 1)
check("compareHands: FOAK < SF", compareHands(foak, rf) === -1)

// compareHands: tie (same high card hand)
const hc2 = evaluate7([
  c(Rank.Ace, Suit.Clubs), c(Rank.King, Suit.Clubs), c(Rank.Jack, Suit.Hearts),
  c(Rank.Nine, Suit.Hearts), c(Rank.Seven, Suit.Diamonds), c(Rank.Five, Suit.Diamonds), c(Rank.Three, Suit.Spades),
])
check("compareHands: identical HighCard = tie", compareHands(hc, hc2) === 0)


function key(card: Card) { return `${card.rank}${card.suit}` }

function checkBestFive(label: string, hand: ReturnType<typeof evaluate7>) {
  check(`${label}: bestFive length=5`, hand.bestFive.length === 5, hand.bestFive.map(key))
  const s = new Set(hand.bestFive.map(key))
  check(`${label}: bestFive unique`, s.size === 5, hand.bestFive.map(key))
}

// Run on a few hands you already have:
checkBestFive("bestFive rf", rf)
checkBestFive("bestFive sf", sf)
checkBestFive("bestFive wheel", wheel)
checkBestFive("bestFive tp3", tp3)

const st6 = evaluate7([
  c(Rank.Six, Suit.Spades), c(Rank.Five, Suit.Hearts), c(Rank.Four, Suit.Clubs),
  c(Rank.Three, Suit.Diamonds), c(Rank.Two, Suit.Spades),
  c(Rank.King, Suit.Hearts), c(Rank.Nine, Suit.Clubs),
])
check("Straight: 6-high beats wheel", compareHands(st6, wheel) === 1, [st6.tiebreakers, wheel.tiebreakers])

const flA = evaluate7([
  c(Rank.Ace, Suit.Hearts), c(Rank.Queen, Suit.Hearts), c(Rank.Nine, Suit.Hearts),
  c(Rank.Six, Suit.Hearts), c(Rank.Two, Suit.Hearts),
  c(Rank.King, Suit.Spades), c(Rank.Three, Suit.Clubs),
])
const flB = evaluate7([
  c(Rank.Ace, Suit.Diamonds), c(Rank.Jack, Suit.Diamonds), c(Rank.Nine, Suit.Diamonds),
  c(Rank.Six, Suit.Diamonds), c(Rank.Two, Suit.Diamonds),
  c(Rank.King, Suit.Hearts), c(Rank.Three, Suit.Spades),
])
check("Flush kicker: AQ... beats AJ...", compareHands(flA, flB) === 1, [flA.tiebreakers, flB.tiebreakers])

const tpKickA = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts),
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts),
  c(Rank.Queen, Suit.Clubs), c(Rank.Two, Suit.Diamonds), c(Rank.Three, Suit.Spades),
])
const tpKickB = evaluate7([
  c(Rank.Ace, Suit.Diamonds), c(Rank.Ace, Suit.Clubs),
  c(Rank.King, Suit.Diamonds), c(Rank.King, Suit.Clubs),
  c(Rank.Jack, Suit.Hearts), c(Rank.Two, Suit.Clubs), c(Rank.Three, Suit.Hearts),
])
check("TwoPair kicker: Q beats J", compareHands(tpKickA, tpKickB) === 1, [tpKickA.tiebreakers, tpKickB.tiebreakers])


const tripsA = evaluate7([
  c(Rank.Queen, Suit.Spades), c(Rank.Queen, Suit.Hearts), c(Rank.Queen, Suit.Clubs),
  c(Rank.Ace, Suit.Diamonds), c(Rank.King, Suit.Spades),
  c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
const tripsB = evaluate7([
  c(Rank.Queen, Suit.Diamonds), c(Rank.Queen, Suit.Clubs), c(Rank.Queen, Suit.Hearts),
  c(Rank.Ace, Suit.Spades), c(Rank.Jack, Suit.Spades),
  c(Rank.Two, Suit.Diamonds), c(Rank.Three, Suit.Hearts),
])
check("Trips kicker: AK beats AJ", compareHands(tripsA, tripsB) === 1, [tripsA.tiebreakers, tripsB.tiebreakers])

const fhA = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.Ace, Suit.Clubs),
  c(Rank.King, Suit.Spades), c(Rank.King, Suit.Hearts),
  c(Rank.Two, Suit.Clubs), c(Rank.Three, Suit.Diamonds),
])
const fhB = evaluate7([
  c(Rank.King, Suit.Clubs), c(Rank.King, Suit.Diamonds), c(Rank.King, Suit.Hearts),
  c(Rank.Ace, Suit.Diamonds), c(Rank.Ace, Suit.Clubs),
  c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Spades),
])
check("FullHouse: AAAKK beats KKKAA", compareHands(fhA, fhB) === 1, [fhA.tiebreakers, fhB.tiebreakers])

const quadsA = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.Ace, Suit.Clubs), c(Rank.Ace, Suit.Diamonds),
  c(Rank.King, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
const quadsB = evaluate7([
  c(Rank.Ace, Suit.Spades), c(Rank.Ace, Suit.Hearts), c(Rank.Ace, Suit.Clubs), c(Rank.Ace, Suit.Diamonds),
  c(Rank.Queen, Suit.Spades), c(Rank.Two, Suit.Hearts), c(Rank.Three, Suit.Clubs),
])
check("Quads kicker: K kicker beats Q kicker", compareHands(quadsA, quadsB) === 1, [quadsA.tiebreakers, quadsB.tiebreakers])


const sf9 = evaluate7([
  c(Rank.Nine, Suit.Hearts), c(Rank.Eight, Suit.Hearts), c(Rank.Seven, Suit.Hearts),
  c(Rank.Six, Suit.Hearts), c(Rank.Five, Suit.Hearts),
  c(Rank.Ace, Suit.Spades), c(Rank.King, Suit.Clubs),
])
const sfT = evaluate7([
  c(Rank.Ten, Suit.Clubs), c(Rank.Nine, Suit.Clubs), c(Rank.Eight, Suit.Clubs),
  c(Rank.Seven, Suit.Clubs), c(Rank.Six, Suit.Clubs),
  c(Rank.Ace, Suit.Hearts), c(Rank.King, Suit.Spades),
])
check("StraightFlush: T-high beats 9-high", compareHands(sfT, sf9) === 1, [sfT.tiebreakers, sf9.tiebreakers])


const straightVsTrips = evaluate7([
  c(Rank.Nine, Suit.Spades), c(Rank.Eight, Suit.Hearts), c(Rank.Seven, Suit.Clubs),
  c(Rank.Six, Suit.Diamonds), c(Rank.Five, Suit.Spades),
  c(Rank.Five, Suit.Hearts), c(Rank.Five, Suit.Clubs),
])
check("Category ordering: Straight beats Trips", straightVsTrips.rank === HandRank.Straight, straightVsTrips)


let threw = false
try { evaluate7([c(Rank.Ace, Suit.Spades)] as any) } catch { threw = true }
check("evaluate7 throws on wrong length", threw)

//NEXT LEVEL EDGE CASES
check(
  "StraightFlush bestFive all same suit",
  new Set(rf.bestFive.map(x => x.suit)).size === 1
)

check(
  "Straight bestFive has 5 distinct ranks",
  new Set(st.bestFive.map(x => x.rank)).size === 5,
  st.bestFive
)

const permuted = [...wheelCards].reverse()
const w2 = evaluate7(permuted)
check("Permutation invariance: rank", w2.rank === wheel.rank)
check("Permutation invariance: tiebreakers", JSON.stringify(w2.tiebreakers) === JSON.stringify(wheel.tiebreakers))
check("Permutation invariance: bestFive ranks set",
  new Set(w2.bestFive.map(x=>x.rank)).size === new Set(wheel.bestFive.map(x=>x.rank)).size
)



console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
