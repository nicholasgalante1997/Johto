const fs = require('fs');
const path = require('path');

const cardsDir = '/home/nick/code/Pokemon/packages/@pokemon-data/data/cards';
const setDirs = fs.readdirSync(cardsDir).filter(d => d.endsWith('.d'));

console.log('=== Pokemon TCG Card Cleanup Script ===\n');

// Step 1: Read all cards and separate correct vs misplaced
const correctCardsBySet = {};
const misplacedCardsPool = [];
const setMetadata = {};

console.log('Step 1: Analyzing all card files...\n');

setDirs.forEach(setDir => {
  const setId = setDir.replace('.d', '');
  const cardsFile = path.join(cardsDir, setDir, 'cards.json');

  if (fs.existsSync(cardsFile)) {
    const data = JSON.parse(fs.readFileSync(cardsFile, 'utf8'));

    // Store set metadata from the first card (they should all have the same set info)
    if (data.data.length > 0 && data.data[0].set) {
      setMetadata[setId] = {
        id: data.data[0].set.id,
        name: data.data[0].set.name,
        total: data.data[0].set.total,
        printedTotal: data.data[0].set.printedTotal
      };
    }

    const correctCards = [];
    const misplacedCards = [];

    data.data.forEach(card => {
      const actualSetId = card.set ? card.set.id : null;

      if (!actualSetId || actualSetId === setId) {
        correctCards.push(card);
      } else {
        misplacedCards.push(card);
      }
    });

    correctCardsBySet[setId] = correctCards;

    if (misplacedCards.length > 0) {
      console.log(`${setId}: ${correctCards.length} correct, ${misplacedCards.length} misplaced`);
      misplacedCardsPool.push(...misplacedCards);
    } else {
      console.log(`${setId}: ${correctCards.length} correct (no issues)`);
    }
  }
});

console.log(`\nTotal misplaced cards found: ${misplacedCardsPool.length}\n`);

// Step 2: Sort misplaced cards by their actual set ID (alphanumeric)
console.log('Step 2: Sorting misplaced cards by set ID...\n');
misplacedCardsPool.sort((a, b) => {
  const setA = a.set ? a.set.id : '';
  const setB = b.set ? b.set.id : '';
  return setA.localeCompare(setB);
});

// Step 3: Process misplaced cards and add them to correct files if missing
console.log('Step 3: Processing misplaced cards...\n');

const cardsToAdd = {};
const stats = {
  alreadyExists: 0,
  willBeAdded: 0,
  noDestination: 0
};

misplacedCardsPool.forEach(card => {
  const targetSetId = card.set ? card.set.id : null;

  if (!targetSetId) {
    console.log(`Warning: Card ${card.id} has no set information, skipping`);
    stats.noDestination++;
    return;
  }

  // Check if the card already exists in the correct set
  const existsInCorrectSet = correctCardsBySet[targetSetId]?.some(c => c.id === card.id);

  if (existsInCorrectSet) {
    stats.alreadyExists++;
  } else {
    // Card needs to be added to the correct set
    if (!cardsToAdd[targetSetId]) {
      cardsToAdd[targetSetId] = [];
    }
    cardsToAdd[targetSetId].push(card);
    stats.willBeAdded++;
  }
});

console.log(`Cards already in correct location: ${stats.alreadyExists}`);
console.log(`Cards to be added to correct files: ${stats.willBeAdded}`);
console.log(`Cards with no destination: ${stats.noDestination}\n`);

// Step 4: Write updated files
console.log('Step 4: Writing updated card files...\n');

let filesUpdated = 0;

setDirs.forEach(setDir => {
  const setId = setDir.replace('.d', '');
  const cardsFile = path.join(cardsDir, setDir, 'cards.json');

  if (!fs.existsSync(cardsFile)) return;

  const data = JSON.parse(fs.readFileSync(cardsFile, 'utf8'));
  const originalCount = data.data.length;

  // Start with correct cards for this set
  let finalCards = correctCardsBySet[setId] || [];

  // Add any cards that were misplaced from other sets
  if (cardsToAdd[setId] && cardsToAdd[setId].length > 0) {
    console.log(`${setId}: Adding ${cardsToAdd[setId].length} missing cards`);
    finalCards = [...finalCards, ...cardsToAdd[setId]];
  }

  // Sort cards by ID to maintain consistent ordering
  finalCards.sort((a, b) => a.id.localeCompare(b.id));

  const finalCount = finalCards.length;
  const expectedTotal = setMetadata[setId]?.total || finalCount;

  // Update data
  data.data = finalCards;

  // Write back to file
  fs.writeFileSync(cardsFile, JSON.stringify(data, null, 2), 'utf8');

  const change = finalCount - originalCount;
  const changeStr = change > 0 ? `+${change}` : change;

  console.log(`${setId}: ${originalCount} → ${finalCount} cards (${changeStr}) [expected: ${expectedTotal}]`);

  if (finalCount !== expectedTotal) {
    console.log(`  ⚠️  Warning: Final count (${finalCount}) doesn't match expected total (${expectedTotal})`);
  }

  filesUpdated++;
});

console.log(`\n=== Cleanup Complete ===`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total misplaced cards resolved: ${misplacedCardsPool.length}`);
