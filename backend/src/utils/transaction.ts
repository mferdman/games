import type Database from 'better-sqlite3';

/**
 * Transaction wrapper for atomic database operations.
 *
 * Ensures that a series of database operations either all succeed or all fail.
 * Critical for preventing race conditions in concurrent operations.
 *
 * @example
 * transaction(db, (db) => {
 *   saveGameState(db, state);
 *   updateLeaderboardStats(db, userId, gameId);
 * });
 */
export function transaction<T>(db: Database.Database, fn: (db: Database.Database) => T): T {
  db.prepare('BEGIN').run();
  try {
    const result = fn(db);
    db.prepare('COMMIT').run();
    return result;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}
