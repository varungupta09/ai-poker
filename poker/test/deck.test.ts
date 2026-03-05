import { createFullDeck, shuffleInPlace, drawCard, drawCards } from "../deck"
import { Card } from "../types"


//test 1: Deck has 52 cards
function testDeckHas52Cards() {
  const deck = createFullDeck()

  if (deck.length !== 52) {
    throw new Error(`Deck should have 52 cards, got ${deck.length}`)
  }

  console.log("✓ Deck has 52 cards")
}

//test 2: No Duplicate cards in the deck
function testNoDuplicateCards() {
  const deck = createFullDeck()

  const seen = new Set<string>()

  for (const card of deck) {
    const key = `${card.rank}-${card.suit}`

    if (seen.has(key)) {
      throw new Error(`Duplicate card detected: ${key}`)
    }

    seen.add(key)
  }

  console.log("✓ No duplicate cards")
}

//test 3: Drawing cards reduces the deck size
function testDrawReducesDeckSize() {
  const deck = createFullDeck()

  const initialSize = deck.length

  drawCard(deck)

  if (deck.length !== initialSize - 1) {
    throw new Error("Drawing a card should reduce deck size by 1")
  }

  console.log("✓ Drawing reduces deck size")
}

//test 4: Drawing too many cards throws an error
function testDrawingTooManyCardsThrows() {
  const deck = createFullDeck()

  let errorThrown = false

  try {
    drawCards(deck, 60)
  } catch (err) {
    errorThrown = true
  }

  if (!errorThrown) {
    throw new Error("Expected drawCards to throw when drawing too many cards")
  }

  console.log("✓ Drawing too many cards throws error")
}

//test 5: Test shuffle does not lose cards
function testShuffleKeepsAllCards() {
  const deck = createFullDeck()

  shuffleInPlace(deck)

  if (deck.length !== 52) {
    throw new Error("Shuffle changed deck size")
  }

  console.log("✓ Shuffle keeps all cards")
}

//run all tests
function runTests() {
  console.log("Running deck tests...\n")

  testDeckHas52Cards()
  testNoDuplicateCards()
  testDrawReducesDeckSize()
  testDrawingTooManyCardsThrows()
  testShuffleKeepsAllCards()

  console.log("\nAll deck tests passed!")
}

runTests()