#!/usr/bin/env bun
/**
 * Database Card Completeness Report
 *
 * Analyzes the SQLite database to show which sets have complete card coverage
 * by comparing the actual card count against each set's `total` field.
 */

import { Database } from 'bun:sqlite';
import { resolve } from 'path';

const DB_PATH = resolve(import.meta.dir, '../database/pokemon-data.sqlite3.db');

interface SetRow {
  id: string;
  name: string;
  series: string;
  total: number;
  printed_total: number;
  release_date: string;
}

interface CardCountRow {
  set_id: string;
  card_count: number;
}

interface SetReport {
  id: string;
  name: string;
  series: string;
  expectedTotal: number;
  actualCount: number;
  missing: number;
  completeness: number;
  releaseDate: string;
}

function openDatabase(): Database {
  return new Database(DB_PATH, { readonly: true });
}

function getAllSets(db: Database): SetRow[] {
  return db
    .query<
      SetRow,
      []
    >('SELECT id, name, series, total, printed_total, release_date FROM pokemon_card_sets ORDER BY release_date DESC')
    .all();
}

function getCardCountsPerSet(db: Database): Map<string, number> {
  const rows = db
    .query<
      CardCountRow,
      []
    >('SELECT set_id, COUNT(*) as card_count FROM pokemon_cards GROUP BY set_id')
    .all();

  return new Map(rows.map((r) => [r.set_id, r.card_count]));
}

function generateReport(
  sets: SetRow[],
  cardCounts: Map<string, number>
): SetReport[] {
  return sets.map((set) => {
    const actualCount = cardCounts.get(set.id) ?? 0;
    const expectedTotal = set.total ?? set.printed_total ?? 0;
    const missing = Math.max(0, expectedTotal - actualCount);
    const completeness =
      expectedTotal > 0 ? (actualCount / expectedTotal) * 100 : 100;

    return {
      id: set.id,
      name: set.name,
      series: set.series,
      expectedTotal,
      actualCount,
      missing,
      completeness: Math.min(100, completeness),
      releaseDate: set.release_date
    };
  });
}

function formatTable(reports: SetReport[]): void {
  const complete = reports.filter((r) => r.missing === 0);
  const incomplete = reports.filter((r) => r.missing > 0);
  const empty = reports.filter((r) => r.actualCount === 0);

  const totalExpected = reports.reduce((sum, r) => sum + r.expectedTotal, 0);
  const totalActual = reports.reduce((sum, r) => sum + r.actualCount, 0);
  const totalMissing = reports.reduce((sum, r) => sum + r.missing, 0);

  console.log('\n' + '='.repeat(100));
  console.log('  POKEMON TCG DATABASE CARD COMPLETENESS REPORT');
  console.log('='.repeat(100));

  console.log('\n--- SUMMARY ---\n');
  console.log(`Total Sets:           ${reports.length}`);
  console.log(
    `Complete Sets:        ${complete.length} (${((complete.length / reports.length) * 100).toFixed(1)}%)`
  );
  console.log(`Incomplete Sets:      ${incomplete.length}`);
  console.log(`Empty Sets:           ${empty.length}`);
  console.log(`\nTotal Cards Expected: ${totalExpected.toLocaleString()}`);
  console.log(`Total Cards in DB:    ${totalActual.toLocaleString()}`);
  console.log(`Total Cards Missing:  ${totalMissing.toLocaleString()}`);
  console.log(
    `Overall Completeness: ${((totalActual / totalExpected) * 100).toFixed(2)}%`
  );

  if (incomplete.length > 0) {
    console.log('\n--- INCOMPLETE SETS ---\n');
    console.log(
      'Set ID'.padEnd(12) +
        'Name'.padEnd(35) +
        'Expected'.padStart(10) +
        'Actual'.padStart(10) +
        'Missing'.padStart(10) +
        'Complete'.padStart(10)
    );
    console.log('-'.repeat(87));

    incomplete
      .sort((a, b) => b.missing - a.missing)
      .forEach((r) => {
        console.log(
          r.id.padEnd(12) +
            r.name.slice(0, 33).padEnd(35) +
            r.expectedTotal.toString().padStart(10) +
            r.actualCount.toString().padStart(10) +
            r.missing.toString().padStart(10) +
            `${r.completeness.toFixed(1)}%`.padStart(10)
        );
      });
  }

  if (empty.length > 0) {
    console.log('\n--- EMPTY SETS (No Cards) ---\n');
    empty.forEach((r) => {
      console.log(
        `  ${r.id.padEnd(12)} ${r.name} (expected: ${r.expectedTotal})`
      );
    });
  }

  if (complete.length > 0 && complete.length <= 20) {
    console.log('\n--- COMPLETE SETS ---\n');
    complete.forEach((r) => {
      console.log(`  ${r.id.padEnd(12)} ${r.name} (${r.actualCount} cards)`);
    });
  } else if (complete.length > 20) {
    console.log(
      `\n--- COMPLETE SETS (${complete.length} total, showing first 20) ---\n`
    );
    complete.slice(0, 20).forEach((r) => {
      console.log(`  ${r.id.padEnd(12)} ${r.name} (${r.actualCount} cards)`);
    });
  }

  console.log('\n' + '='.repeat(100) + '\n');
}

function main(): void {
  console.log(`Opening database: ${DB_PATH}`);

  const db = openDatabase();
  const sets = getAllSets(db);
  const cardCounts = getCardCountsPerSet(db);
  const reports = generateReport(sets, cardCounts);

  formatTable(reports);

  db.close();
}

main();
