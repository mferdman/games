import type { Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';

/**
 * Session user data (matches backend/src/models/types.ts)
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  groupName: string;
}

/**
 * Create a test user with default values
 */
export function createTestUser(overrides?: Partial<SessionUser>): SessionUser {
  return {
    id: 'test-user-1',
    email: 'test1@example.com',
    name: 'Test User',
    avatar_url: null,
    groupName: 'test',
    ...overrides,
  };
}

/**
 * Middleware to bypass authentication for testing.
 * Injects a user into req.user and makes req.isAuthenticated() return true.
 *
 * @example
 * const app = express();
 * app.use(bypassAuth(createTestUser()));
 * app.get('/protected', requireAuth, handler);
 */
export function bypassAuth(user: SessionUser) {
  return (req: any, res: Response, next: NextFunction) => {
    req.user = user;
    req.isAuthenticated = () => true;
    next();
  };
}

/**
 * Create a test session directly in the database.
 * Useful for integration tests that need real session persistence.
 *
 * @param db - Database instance
 * @param user - User to create session for
 * @returns Session ID that can be used in Cookie header
 */
export function createTestSession(db: Database.Database, user: SessionUser): string {
  const sessionId = `test-session-${Date.now()}-${Math.random()}`;
  const expires = Date.now() + 86400000; // 24 hours

  const sessionData = {
    cookie: {
      originalMaxAge: 2592000000, // 30 days
      expires: new Date(expires).toISOString(),
      httpOnly: true,
      path: '/',
    },
    passport: {
      user: user,
    },
  };

  db.prepare(`
    INSERT INTO sessions (sid, sess, expire)
    VALUES (?, ?, ?)
  `).run(sessionId, JSON.stringify(sessionData), expires);

  return `connect.sid=s%3A${sessionId}`;
}

/**
 * Insert a test user directly into the database.
 * Useful for tests that need actual user records.
 *
 * @param db - Database instance
 * @param user - Partial user data (id, email, groupName required)
 */
export function insertTestUser(
  db: Database.Database,
  user: Partial<SessionUser> & { id: string; email: string; groupName: string }
): void {
  const now = Date.now();

  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, name, avatar_url, group_name, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    user.email,
    user.name || 'Test User',
    user.avatar_url || null,
    user.groupName,
    now,
    now
  );
}

/**
 * Insert a test user into whitelist table.
 * This allows testing whitelist validation logic.
 *
 * @param db - Database instance
 * @param email - User email
 * @param groupName - Group assignment
 */
export function insertTestWhitelist(
  db: Database.Database,
  email: string,
  groupName: string
): void {
  db.prepare(`
    INSERT OR REPLACE INTO whitelist (email, group_name, added_at)
    VALUES (?, ?, ?)
  `).run(email.toLowerCase(), groupName, Date.now());
}
