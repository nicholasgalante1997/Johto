#!/usr/bin/env bun
/**
 * Missing Cards Finder
 *
 * For a given set (or all incomplete sets), shows which card numbers
 * are missing from the database based on the set's total count.
 */

import { Database } from 'bun:sqlite';
import { resolve } from 'path';

const DB_PATH = resolve(import.meta.dir, '../database/pokemon-data.sqlite3.db');

interface SetRow {
  id: string;
  name: string;
  total: number;
  printed_total: number;
}

interface CardRow {
  number: string;
}

function openDatabase(): Database {
  return new Database(DB_PATH, { readonly: true });
}

function getSet(db: Database, setId: string): SetRow | null {
  return db
    .query<
      SetRow,
      [string]
    >('SELECT id, name, total, printed_total FROM pokemon_card_sets WHERE id = ?')
    .get(setId);
}

function getIncompleteSets(db: Database): SetRow[] {
  return db
    .query<SetRow, []>(
      `
      SELECT s.id, s.name, s.total, s.printed_total
      FROM pokemon_card_sets s
      LEFT JOIN (
        SELECT set_id, COUNT(*) as cnt FROM pokemon_cards GROUP BY set_id
      ) c ON s.id = c.set_id
      WHERE COALESCE(c.cnt, 0) < COALESCE(s.total, s.printed_total, 0)
      ORDER BY s.release_date DESC
    `
    )
    .all();
}

function getCardNumbersInSet(db: Database, setId: string): Set<string> {
  const rows = db
    .query<
      CardRow,
      [string]
    >('SELECT number FROM pokemon_cards WHERE set_id = ?')
    .all(setId);
  return new Set(rows.map((r) => r.number));
}

function findMissingNumbers(
  existingNumbers: Set<string>,
  total: number
): string[] {
  const missing: string[] = [];

  for (let i = 1; i <= total; i++) {
    const numStr = i.toString();
    if (!existingNumbers.has(numStr)) {
      missing.push(numStr);
    }
  }

  return missing;
}

function analyzeSet(db: Database, set: SetRow): void {
  const expectedTotal = set.total ?? set.printed_total ?? 0;
  const existingNumbers = getCardNumbersInSet(db, set.id);
  const missingNumbers = findMissingNumbers(existingNumbers, expectedTotal);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Set: ${set.name} (${set.id})`);
  console.log(
    `Expected: ${expectedTotal} | Found: ${existingNumbers.size} | Missing: ${missingNumbers.length}`
  );
  console.log('='.repeat(60));

  if (missingNumbers.length === 0) {
    console.log('  All cards present!');
  } else if (missingNumbers.length === expectedTotal) {
    console.log('  Set is empty - no cards in database.');
  } else if (missingNumbers.length <= 50) {
    console.log(`  Missing card numbers: ${missingNumbers.join(', ')}`);
  } else {
    console.log(
      `  Missing card numbers (first 50 of ${missingNumbers.length}):`
    );
    console.log(`  ${missingNumbers.slice(0, 50).join(', ')}...`);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const setId = args[0];

  const db = openDatabase();

  if (setId) {
    const set = getSet(db, setId);
    if (!set) {
      console.error(`Set not found: ${setId}`);
      process.exit(1);
    }
    analyzeSet(db, set);
  } else {
    console.log('Analyzing all incomplete sets...');
    console.log('(Pass a set ID as argument to analyze a specific set)');

    const incompleteSets = getIncompleteSets(db);

    if (incompleteSets.length === 0) {
      console.log('\nAll sets are complete!');
    } else {
      console.log(`\nFound ${incompleteSets.length} incomplete sets:\n`);
      for (const set of incompleteSets) {
        analyzeSet(db, set);
      }
    }
  }

  db.close();
}

main();
