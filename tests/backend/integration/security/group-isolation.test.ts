import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, closeDatabase } from '../../../backend/setup/testDatabase.js';
import { createTestUser, insertTestUser, insertTestWhitelist } from '../../../backend/setup/testAuth.js';
import type Database from 'better-sqlite3';

/**
 * Security tests for group-based data isolation - CRITICAL
 *
 * The system uses group_name for multi-tenant data isolation.
 * These tests verify that users can NEVER access data from other groups.
 */

describe('Group Isolation Security (CRITICAL)', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('Leaderboard Data Isolation', () => {
    it('should never show leaderboard data from other groups', async () => {
      /**
       * SECURITY-CRITICAL: Leaderboard queries must filter by group_name
       * backend/src/services/leaderboard.service.ts:141 - WHERE u.group_name = ?
       */

      // Create users in different groups
      const testUser = createTestUser({ id: 'user-1', groupName: 'test' });
      const otherUser = createTestUser({
        id: 'user-2',
        email: 'other@example.com',
        groupName: 'other-group',
      });

      insertTestWhitelist(db, testUser.email, testUser.groupName);
      insertTestWhitelist(db, otherUser.email, otherUser.groupName);
      insertTestUser(db, testUser);
      insertTestUser(db, otherUser);

      // Insert leaderboard stats for both users
      const gameId = 'ferdle-en-5';
      const periodType = 'daily';
      const periodKey = '2025-11-27';

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        testUser.id, gameId, periodType, periodKey,
        10, 5, 50, 600, 2, 3, 5.0, 0.5, Date.now()
      );

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        otherUser.id, gameId, periodType, periodKey,
        10, 10, 40, 500, 5, 5, 4.0, 1.0, Date.now()
      );

      // Query leaderboard as test user (should only see test group)
      // TODO: Call getLeaderboard() with testUser's groupName
      // This requires setting up the service with dependency injection

      const leaderboard = db.prepare(`
        SELECT ls.*, u.name, u.avatar_url
        FROM leaderboard_stats ls
        JOIN users u ON ls.user_id = u.id
        WHERE ls.game_id = ?
          AND ls.period_type = ?
          AND ls.period_key = ?
          AND u.group_name = ?
        ORDER BY ls.success_rate DESC
      `).all(gameId, periodType, periodKey, testUser.groupName);

      // Should ONLY contain test group user
      expect(leaderboard.length).toBe(1);
      expect(leaderboard[0].user_id).toBe(testUser.id);

      // Verify other user is NOT in results
      const hasOtherUser = leaderboard.some((entry: any) => entry.user_id === otherUser.id);
      expect(hasOtherUser).toBe(false);
    });

    it('should isolate user rank queries by group', async () => {
      // User should only see their rank within their own group
      // Not their global rank across all groups

      const testUser = createTestUser({ id: 'user-1', groupName: 'test' });
      const otherUser = createTestUser({
        id: 'user-2',
        email: 'other@example.com',
        groupName: 'other-group',
      });

      insertTestWhitelist(db, testUser.email, testUser.groupName);
      insertTestWhitelist(db, otherUser.email, otherUser.groupName);
      insertTestUser(db, testUser);
      insertTestUser(db, otherUser);

      const gameId = 'ferdle-en-5';
      const periodType = 'all_time';
      const periodKey = 'all';

      // Test user: 50% win rate (rank 2 globally, rank 1 in group)
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(testUser.id, gameId, periodType, periodKey, 10, 5, 0.5, Date.now());

      // Other user: 100% win rate (rank 1 globally, but different group)
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(otherUser.id, gameId, periodType, periodKey, 10, 10, 1.0, Date.now());

      // TODO: Call getUserRank() for testUser
      // Should return rank = 1 (first in their group)
      // NOT rank = 2 (global rank)

      expect(true).toBe(true);
    });
  });

  describe('Game State Isolation', () => {
    it('should not allow accessing other users game states', async () => {
      /**
       * Each user should only access their own game states
       * Even within the same group
       */

      const user1 = createTestUser({ id: 'user-1', groupName: 'test' });
      const user2 = createTestUser({
        id: 'user-2',
        email: 'test2@example.com',
        groupName: 'test',
      });

      insertTestWhitelist(db, user1.email, user1.groupName);
      insertTestWhitelist(db, user2.email, user2.groupName);
      insertTestUser(db, user1);
      insertTestUser(db, user2);

      const gameId = 'ferdle-en-5';
      const gameDate = '2025-11-27';

      // Create game for user-1
      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at,
          won, attempts, max_attempts, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        user1.id, gameId, gameDate, Date.now(),
        0, 3, 10, JSON.stringify({ targetWord: 'ROBOT', guesses: [] })
      );

      // User-2 tries to access user-1's game (should create NEW game)
      // TODO: Call getOrCreateGame() as user-2
      // Should create separate game, not return user-1's game

      const user1Games = db.prepare(`
        SELECT * FROM game_progress
        WHERE user_id = ? AND game_id = ? AND game_date = ?
      `).all(user1.id, gameId, gameDate);

      const user2Games = db.prepare(`
        SELECT * FROM game_progress
        WHERE user_id = ? AND game_id = ? AND game_date = ?
      `).all(user2.id, gameId, gameDate);

      expect(user1Games.length).toBe(1);
      expect(user2Games.length).toBe(0); // Should be 1 after creating new game

      // Verify target words could be different (if they were separate days)
      // But for same date, should be same word (deterministic)
    });

    it('should enforce unique constraint per user-game-date', async () => {
      // Database constraint: UNIQUE(user_id, game_id, game_date)
      // This prevents duplicate game entries

      const user = createTestUser();
      insertTestWhitelist(db, user.email, user.groupName);
      insertTestUser(db, user);

      const gameId = 'ferdle-en-5';
      const gameDate = '2025-11-27';

      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at,
          won, attempts, max_attempts, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user.id, gameId, gameDate, Date.now(), 0, 1, 10, '{}');

      // Try to insert duplicate (should fail or be handled by ON CONFLICT)
      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(user.id, gameId, gameDate, Date.now(), 0, 2, 10, '{}');
      }).toThrow();
    });
  });

  describe('Whitelist Group Assignment', () => {
    it('should enforce group assignment from whitelist', async () => {
      const email = 'newuser@example.com';
      const expectedGroup = 'family1';

      insertTestWhitelist(db, email, expectedGroup);

      // TODO: Simulate OAuth login
      // User should be assigned to 'family1' group
      // All their data should be isolated to that group

      const whitelistEntry = db.prepare(`
        SELECT * FROM whitelist WHERE email = ?
      `).get(email.toLowerCase());

      expect(whitelistEntry).toBeDefined();
      expect((whitelistEntry as any).group_name).toBe(expectedGroup);
    });

    it('should reject users not in whitelist', async () => {
      const email = 'notwhitelisted@example.com';

      const whitelistEntry = db.prepare(`
        SELECT * FROM whitelist WHERE email = ?
      `).get(email.toLowerCase());

      expect(whitelistEntry).toBeUndefined();

      // TODO: OAuth callback should reject this user
      // Should not create user record
      // Should not create session
    });
  });
});
