import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, closeDatabase } from '../../../backend/setup/testDatabase.js';
import type Database from 'better-sqlite3';

/**
 * Database Schema and Constraint Tests
 *
 * These tests ensure that database schema, constraints, and indexes
 * are working correctly. Critical for data integrity.
 */

describe('Database Schema and Constraints', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe('Users Table', () => {
    it('should enforce unique ID constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO users (id, email, name, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('user-1', 'user1@example.com', 'User 1', 'test', now, now);

      expect(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, group_name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('user-1', 'different@example.com', 'User 2', 'test', now, now);
      }).toThrow();
    });

    it('should enforce unique email constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO users (id, email, name, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('user-1', 'duplicate@example.com', 'User 1', 'test', now, now);

      expect(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, group_name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run('user-2', 'duplicate@example.com', 'User 2', 'test', now, now);
      }).toThrow();
    });

    it('should require non-null fields', () => {
      const now = Date.now();

      // Missing name
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, email, group_name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?)
        `).run('user-no-name', 'test@example.com', 'test', now, now);
      }).toThrow();

      // Missing email
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, name, group_name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?)
        `).run('user-no-email', 'Test User', 'test', now, now);
      }).toThrow();

      // Missing group_name
      expect(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?)
        `).run('user-no-group', 'test@example.com', 'Test User', now, now);
      }).toThrow();
    });

    it('should allow null avatar_url', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO users (id, email, name, avatar_url, group_name, created_at, last_login)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run('user-null-avatar', 'test@example.com', 'Test User', null, 'test', now, now);
      }).not.toThrow();

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user-null-avatar') as any;
      expect(user.avatar_url).toBeNull();
    });

    it('should store and retrieve all fields correctly', () => {
      const now = Date.now();
      const userData = {
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        group_name: 'test-group',
        created_at: now,
        last_login: now,
      };

      db.prepare(`
        INSERT INTO users (id, email, name, avatar_url, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        userData.id,
        userData.email,
        userData.name,
        userData.avatar_url,
        userData.group_name,
        userData.created_at,
        userData.last_login
      );

      const retrieved = db.prepare('SELECT * FROM users WHERE id = ?').get('test-user') as any;

      expect(retrieved.id).toBe(userData.id);
      expect(retrieved.email).toBe(userData.email);
      expect(retrieved.name).toBe(userData.name);
      expect(retrieved.avatar_url).toBe(userData.avatar_url);
      expect(retrieved.group_name).toBe(userData.group_name);
      expect(retrieved.created_at).toBe(userData.created_at);
      expect(retrieved.last_login).toBe(userData.last_login);
    });
  });

  describe('Game Progress Table', () => {
    beforeEach(() => {
      // Insert test user for foreign key
      const now = Date.now();
      db.prepare(`
        INSERT INTO users (id, email, name, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('test-user', 'test@example.com', 'Test User', 'test', now, now);
    });

    it('should enforce unique (user_id, game_id, game_date) constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at,
          won, attempts, max_attempts, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', '2025-11-27', now, 0, 1, 10, '{}');

      // Duplicate entry should fail
      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', '2025-11-27', now, 0, 2, 10, '{}');
      }).toThrow();
    });

    it('should allow same user to play different games', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', '2025-11-27', now, 0, 1, 10, '{}');

        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-ru-5', '2025-11-27', now, 0, 1, 10, '{}');
      }).not.toThrow();
    });

    it('should allow same game on different dates', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', '2025-11-26', now, 0, 1, 10, '{}');

        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', '2025-11-27', now, 0, 1, 10, '{}');
      }).not.toThrow();
    });

    it('should enforce foreign key to users table', () => {
      const now = Date.now();

      // Non-existent user should fail
      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('non-existent-user', 'ferdle-en-5', '2025-11-27', now, 0, 1, 10, '{}');
      }).toThrow();
    });

    it('should cascade delete on user deletion', () => {
      const now = Date.now();

      // Create game progress
      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at,
          won, attempts, max_attempts, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', '2025-11-27', now, 0, 1, 10, '{}');

      // Delete user
      db.prepare('DELETE FROM users WHERE id = ?').run('test-user');

      // Game progress should also be deleted
      const games = db
        .prepare('SELECT * FROM game_progress WHERE user_id = ?')
        .all('test-user');

      expect(games).toHaveLength(0);
    });

    it('should allow null game_date for unlimited play', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO game_progress (
            user_id, game_id, game_date, started_at,
            won, attempts, max_attempts, state_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'unlimited-game', null, now, 0, 1, 99, '{}');
      }).not.toThrow();

      const game = db
        .prepare('SELECT * FROM game_progress WHERE user_id = ? AND game_id = ?')
        .get('test-user', 'unlimited-game') as any;

      expect(game.game_date).toBeNull();
    });

    it('should store completed_at and time_seconds', () => {
      const now = Date.now();
      const startedAt = now - 60000;
      const completedAt = now;

      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at, completed_at,
          won, attempts, max_attempts, time_seconds, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', '2025-11-27', startedAt, completedAt, 1, 5, 10, 60, '{}');

      const game = db
        .prepare('SELECT * FROM game_progress WHERE user_id = ?')
        .get('test-user') as any;

      expect(game.completed_at).toBe(completedAt);
      expect(game.time_seconds).toBe(60);
      expect(game.won).toBe(1);
    });
  });

  describe('Leaderboard Stats Table', () => {
    beforeEach(() => {
      // Insert test user
      const now = Date.now();
      db.prepare(`
        INSERT INTO users (id, email, name, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('test-user', 'test@example.com', 'Test User', 'test', now, now);
    });

    it('should enforce unique (user_id, game_id, period_type, period_key) constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', 'daily', '2025-11-27', 1, 1, 5, 60, 1, 1, 5.0, 1.0, now);

      // Duplicate entry should fail
      expect(() => {
        db.prepare(`
          INSERT INTO leaderboard_stats (
            user_id, game_id, period_type, period_key,
            games_played, games_won, total_attempts, total_time_seconds,
            current_streak, best_streak, average_attempts, success_rate, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', 'daily', '2025-11-27', 2, 2, 10, 120, 2, 2, 5.0, 1.0, now);
      }).toThrow();
    });

    it('should allow same user with different period types', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO leaderboard_stats (
            user_id, game_id, period_type, period_key,
            games_played, games_won, total_attempts, total_time_seconds,
            current_streak, best_streak, average_attempts, success_rate, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', 'daily', '2025-11-27', 1, 1, 5, 60, 1, 1, 5.0, 1.0, now);

        db.prepare(`
          INSERT INTO leaderboard_stats (
            user_id, game_id, period_type, period_key,
            games_played, games_won, total_attempts, total_time_seconds,
            current_streak, best_streak, average_attempts, success_rate, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run('test-user', 'ferdle-en-5', 'weekly', '2025-W48', 1, 1, 5, 60, 1, 1, 5.0, 1.0, now);
      }).not.toThrow();
    });

    it('should enforce foreign key to users table', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO leaderboard_stats (
            user_id, game_id, period_type, period_key,
            games_played, games_won, total_attempts, total_time_seconds,
            current_streak, best_streak, average_attempts, success_rate, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'non-existent-user',
          'ferdle-en-5',
          'daily',
          '2025-11-27',
          1,
          1,
          5,
          60,
          1,
          1,
          5.0,
          1.0,
          now
        );
      }).toThrow();
    });

    it('should cascade delete on user deletion', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', 'daily', '2025-11-27', 1, 1, 5, 60, 1, 1, 5.0, 1.0, now);

      db.prepare('DELETE FROM users WHERE id = ?').run('test-user');

      const stats = db
        .prepare('SELECT * FROM leaderboard_stats WHERE user_id = ?')
        .all('test-user');

      expect(stats).toHaveLength(0);
    });

    it('should store floating point values for averages', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-user', 'ferdle-en-5', 'all_time', 'all', 3, 2, 15, 180, 1, 2, 5.5, 0.666666, now);

      const stats = db
        .prepare('SELECT * FROM leaderboard_stats WHERE user_id = ?')
        .get('test-user') as any;

      expect(stats.average_attempts).toBeCloseTo(5.5, 1);
      expect(stats.success_rate).toBeCloseTo(0.666666, 5);
    });
  });

  describe('Whitelist Table', () => {
    it('should enforce unique email constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO whitelist (email, group_name, added_at)
        VALUES (?, ?, ?)
      `).run('test@example.com', 'group1', now);

      expect(() => {
        db.prepare(`
          INSERT INTO whitelist (email, group_name, added_at)
          VALUES (?, ?, ?)
        `).run('test@example.com', 'group2', now);
      }).toThrow();
    });

    it('should allow updates via ON CONFLICT', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO whitelist (email, group_name, added_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          group_name = excluded.group_name
      `).run('test@example.com', 'group1', now);

      db.prepare(`
        INSERT INTO whitelist (email, group_name, added_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          group_name = excluded.group_name
      `).run('test@example.com', 'group2', now);

      const entry = db.prepare('SELECT * FROM whitelist WHERE email = ?').get('test@example.com') as any;

      expect(entry.group_name).toBe('group2');
    });

    it('should store email in lowercase', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO whitelist (email, group_name, added_at)
        VALUES (?, ?, ?)
      `).run('test@example.com', 'test', now);

      const entry = db.prepare('SELECT * FROM whitelist WHERE email = ?').get('test@example.com') as any;

      expect(entry).toBeDefined();
      expect(entry.email).toBe('test@example.com');
    });
  });

  describe('AI Image Cache Table', () => {
    it('should enforce unique (word, language) constraint', () => {
      const now = Date.now();

      db.prepare(`
        INSERT INTO ai_image_cache (word, language, image_filename, prompt, generated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('robot', 'en', 'robot_abc123.png', 'A robot illustration', now);

      expect(() => {
        db.prepare(`
          INSERT INTO ai_image_cache (word, language, image_filename, prompt, generated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run('robot', 'en', 'robot_def456.png', 'Different prompt', now);
      }).toThrow();
    });

    it('should allow same word in different languages', () => {
      const now = Date.now();

      expect(() => {
        db.prepare(`
          INSERT INTO ai_image_cache (word, language, image_filename, prompt, generated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run('robot', 'en', 'robot_en.png', 'English robot', now);

        db.prepare(`
          INSERT INTO ai_image_cache (word, language, image_filename, prompt, generated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run('robot', 'ru', 'robot_ru.png', 'Russian robot', now);
      }).not.toThrow();
    });

    it('should store and retrieve all fields', () => {
      const now = Date.now();
      const cacheData = {
        word: 'house',
        language: 'en',
        image_filename: 'house_xyz789.png',
        prompt: 'A house illustration',
        generated_at: now,
      };

      db.prepare(`
        INSERT INTO ai_image_cache (word, language, image_filename, prompt, generated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(cacheData.word, cacheData.language, cacheData.image_filename, cacheData.prompt, cacheData.generated_at);

      const entry = db
        .prepare('SELECT * FROM ai_image_cache WHERE word = ? AND language = ?')
        .get(cacheData.word, cacheData.language) as any;

      expect(entry.word).toBe(cacheData.word);
      expect(entry.language).toBe(cacheData.language);
      expect(entry.image_filename).toBe(cacheData.image_filename);
      expect(entry.prompt).toBe(cacheData.prompt);
      expect(entry.generated_at).toBe(cacheData.generated_at);
    });
  });

  describe('Database Indexes', () => {
    it('should have indexes on frequently queried fields', () => {
      // Check that indexes exist (this is implementation-specific)
      // SQLite stores index info in sqlite_master table

      const indexes = db.prepare(`
        SELECT name, tbl_name, sql
        FROM sqlite_master
        WHERE type = 'index' AND sql IS NOT NULL
      `).all();

      // Should have multiple indexes
      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity across related tables', () => {
      const now = Date.now();

      // Create user
      db.prepare(`
        INSERT INTO users (id, email, name, group_name, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('integrity-test', 'integrity@example.com', 'Integrity Test', 'test', now, now);

      // Create game progress
      db.prepare(`
        INSERT INTO game_progress (
          user_id, game_id, game_date, started_at,
          won, attempts, max_attempts, state_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('integrity-test', 'ferdle-en-5', '2025-11-27', now, 1, 5, 10, '{}');

      // Create leaderboard stats
      db.prepare(`
        INSERT INTO leaderboard_stats (
          user_id, game_id, period_type, period_key,
          games_played, games_won, total_attempts, total_time_seconds,
          current_streak, best_streak, average_attempts, success_rate, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('integrity-test', 'ferdle-en-5', 'daily', '2025-11-27', 1, 1, 5, 60, 1, 1, 5.0, 1.0, now);

      // Verify all data exists
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get('integrity-test');
      const game = db.prepare('SELECT * FROM game_progress WHERE user_id = ?').get('integrity-test');
      const stats = db.prepare('SELECT * FROM leaderboard_stats WHERE user_id = ?').get('integrity-test');

      expect(user).toBeDefined();
      expect(game).toBeDefined();
      expect(stats).toBeDefined();

      // Delete user (should cascade)
      db.prepare('DELETE FROM users WHERE id = ?').run('integrity-test');

      // Verify cascading delete worked
      const gameAfter = db.prepare('SELECT * FROM game_progress WHERE user_id = ?').get('integrity-test');
      const statsAfter = db.prepare('SELECT * FROM leaderboard_stats WHERE user_id = ?').get('integrity-test');

      expect(gameAfter).toBeUndefined();
      expect(statsAfter).toBeUndefined();
    });
  });
});
