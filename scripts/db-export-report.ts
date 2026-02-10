#!/usr/bin/env bun
/**
 * Export Database Report as JSON
 *
 * Generates a JSON report of database completeness for programmatic use.
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
  status: 'complete' | 'partial' | 'empty';
}

interface FullReport {
  generatedAt: string;
  databasePath: string;
  summary: {
    totalSets: number;
    completeSets: number;
    incompleteSets: number;
    emptySets: number;
    totalCardsExpected: number;
    totalCardsInDb: number;
    totalCardsMissing: number;
    overallCompleteness: number;
  };
  sets: SetReport[];
}

function openDatabase(): Database {
  return new Database(DB_PATH, { readonly: true });
}

function generateReport(): FullReport {
  const db = openDatabase();

  const sets = db
    .query<
      SetRow,
      []
    >('SELECT id, name, series, total, printed_total, release_date FROM pokemon_card_sets ORDER BY release_date DESC')
    .all();

  const cardCounts = new Map(
    db
      .query<CardCountRow, []>(
        'SELECT set_id, COUNT(*) as card_count FROM pokemon_cards GROUP BY set_id'
      )
      .all()
      .map((r) => [r.set_id, r.card_count])
  );

  const setReports: SetReport[] = sets.map((set) => {
    const actualCount = cardCounts.get(set.id) ?? 0;
    const expectedTotal = set.total ?? set.printed_total ?? 0;
    const missing = Math.max(0, expectedTotal - actualCount);
    const completeness =
      expectedTotal > 0
        ? Math.min(100, (actualCount / expectedTotal) * 100)
        : 100;

    let status: 'complete' | 'partial' | 'empty';
    if (actualCount === 0) {
      status = 'empty';
    } else if (missing === 0) {
      status = 'complete';
    } else {
      status = 'partial';
    }

    return {
      id: set.id,
      name: set.name,
      series: set.series,
      expectedTotal,
      actualCount,
      missing,
      completeness: Math.round(completeness * 100) / 100,
      releaseDate: set.release_date,
      status
    };
  });

  db.close();

  const complete = setReports.filter((r) => r.status === 'complete');
  const incomplete = setReports.filter((r) => r.status === 'partial');
  const empty = setReports.filter((r) => r.status === 'empty');

  const totalExpected = setReports.reduce((sum, r) => sum + r.expectedTotal, 0);
  const totalActual = setReports.reduce((sum, r) => sum + r.actualCount, 0);
  const totalMissing = setReports.reduce((sum, r) => sum + r.missing, 0);

  return {
    generatedAt: new Date().toISOString(),
    databasePath: DB_PATH,
    summary: {
      totalSets: setReports.length,
      completeSets: complete.length,
      incompleteSets: incomplete.length,
      emptySets: empty.length,
      totalCardsExpected: totalExpected,
      totalCardsInDb: totalActual,
      totalCardsMissing: totalMissing,
      overallCompleteness:
        Math.round((totalActual / totalExpected) * 10000) / 100
    },
    sets: setReports
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const outputPath = args[0];

  const report = generateReport();

  if (outputPath) {
    Bun.write(outputPath, JSON.stringify(report, null, 2));
    console.log(`Report written to: ${outputPath}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

main();
