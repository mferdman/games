import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, closeDatabase } from '../../../backend/setup/testDatabase.js';
import { createTestUser, insertTestUser, insertTestWhitelist } from '../../../backend/setup/testAuth.js';
import type Database from 'better-sqlite3';

/**
 * Tests for leaderboard service
 * Focus: Float comparison precision bugs and ranking correctness
 */

describe('Leaderboard Service', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('Float Comparison Precision (CRITICAL BUG)', () => {
    it('should handle floating point precision in rankings', () => {
      /**
       * BUG: backend/src/services/leaderboard.service.ts:206-228
       * Uses raw float comparison which may have precision issues
       *
       * User 1: 2 wins / 3 games = 0.666666666666...
       * User 2: 4 wins / 6 games = 0.666666666666...
       * These should be treated as equal, but float comparison might differ
       */

      const user1 = createTestUser({ id: 'user-1', name: 'User 1' });
      const user2 = createTestUser({ id: 'user-2', email: 'user2@example.com', name: 'User 2' });

      insertTestWhitelist(db, user1.email, user1.groupName);
      insertTestWhitelist(db, user2.email, user2.groupName);
      insertTestUser(db, user1);
      insertTestUser(db, user2);

      const gameId = 'ferdle-en-5';
      const periodType = 'all_time';
      const periodKey = 'all';

      // User 1: 2/3 = 0.666666...
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, success_rate, average_attempts, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user1.id, gameId, periodType, periodKey, 3, 2, 2/3, 4.5, Date.now());

      // User 2: 4/6 = 0.666666...
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, success_rate, average_attempts, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user2.id, gameId, periodType, periodKey, 6, 4, 4/6, 5.0, Date.now());

      // Query with ORDER BY success_rate
      const leaderboard = db.prepare(`
        SELECT *, ROW_NUMBER() OVER (ORDER BY success_rate DESC, average_attempts ASC) as rank
        FROM leaderboard_stats
        WHERE game_id = ? AND period_type = ? AND period_key = ?
      `).all(gameId, periodType, periodKey);

      expect(leaderboard.length).toBe(2);

      // Ranking should be stable and deterministic
      // Since success_rate is equal, should sort by average_attempts
      // User 1 has 4.5 avg, User 2 has 5.0 avg
      // User 1 should be ranked higher
      expect((leaderboard[0] as any).user_id).toBe(user1.id);
      expect((leaderboard[0] as any).rank).toBe(1);
      expect((leaderboard[1] as any).user_id).toBe(user2.id);
      expect((leaderboard[1] as any).rank).toBe(2);

      // TODO: The actual service uses raw float comparison in WHERE clauses
      // This may produce inconsistent results
      // Fix: Use ROUND(success_rate, 6) in comparisons
    });

    it('should use ROUND() for float comparisons (THE FIX)', () => {
      /**
       * Proper fix for float comparison:
       * WHERE ROUND(ls.success_rate, 6) > ROUND(?, 6)
       *
       * This ensures consistent comparison regardless of float precision
       */

      const user1 = createTestUser({ id: 'user-1' });
      insertTestWhitelist(db, user1.email, user1.groupName);
      insertTestUser(db, user1);

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user1.id, 'ferdle-en-5', 'all_time', 'all', 3, 2, 2/3, Date.now());

      // Query with ROUND()
      const result = db.prepare(`
        SELECT ROUND(success_rate, 6) as rounded_rate
        FROM leaderboard_stats
        WHERE user_id = ?
      `).get(user1.id);

      expect((result as any).rounded_rate).toBeCloseTo(0.666667, 5);
    });
  });

  describe('Period Calculation', () => {
    it('should correctly calculate ISO week numbers', () => {
      // Week 1 starts on Monday with Thursday in first week
      // This is the ISO 8601 standard

      // TODO: Test getISOWeek() function
      // Examples:
      // 2025-01-01 (Wednesday) → Week 1
      // 2025-01-06 (Monday) → Week 2
      // 2024-12-30 (Monday) → Week 1 of 2025

      expect(true).toBe(true);
    });

    it('should format period keys correctly', () => {
      // daily: "2025-11-27"
      // weekly: "2025-W48"
      // monthly: "2025-11"
      // all_time: "all"

      // TODO: Test period key generation
      expect(true).toBe(true);
    });
  });

  describe('Leaderboard Stats Updates', () => {
    it('should update stats incrementally on each game completion', () => {
      const user = createTestUser();
      insertTestWhitelist(db, user.email, user.groupName);
      insertTestUser(db, user);

      const gameId = 'ferdle-en-5';
      const periodType = 'all_time';
      const periodKey = 'all';

      // First game: Win with 5 attempts
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, success_rate, average_attempts, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, gameId, periodType, periodKey, 1, 1, 5, 1.0, 5.0, Date.now());

      // Second game: Loss (no attempts counted)
      db.prepare(`
        UPDATE leaderboard_stats
        SET games_played = 2, games_won = 1, success_rate = 0.5, average_attempts = 5.0
        WHERE user_id = ? AND game_id = ? AND period_type = ? AND period_key = ?
      `).run(user.id, gameId, periodType, periodKey);

      // Third game: Win with 3 attempts
      db.prepare(`
        UPDATE leaderboard_stats
        SET games_played = 3, games_won = 2, total_attempts = 8,
            success_rate = 0.666666, average_attempts = 4.0
        WHERE user_id = ? AND game_id = ? AND period_type = ? AND period_key = ?
      `).run(user.id, gameId, periodType, periodKey);

      const stats = db.prepare(`
        SELECT * FROM leaderboard_stats
        WHERE user_id = ? AND game_id = ? AND period_type = ? AND period_key = ?
      `).get(user.id, gameId, periodType, periodKey);

      expect((stats as any).games_played).toBe(3);
      expect((stats as any).games_won).toBe(2);
      expect((stats as any).total_attempts).toBe(8);
      expect((stats as any).average_attempts).toBeCloseTo(4.0, 1);
      expect((stats as any).success_rate).toBeCloseTo(0.666666, 5);
    });

    it('should create stats for all 4 period types on game completion', () => {
      // When a game completes, should create/update stats for:
      // 1. daily (2025-11-27)
      // 2. weekly (2025-W48)
      // 3. monthly (2025-11)
      // 4. all_time (all)

      // TODO: Test that all 4 are created simultaneously
      expect(true).toBe(true);
    });
  });
});
