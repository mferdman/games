import { db } from '../config/database.js';
import type { User } from '../models/types.js';

/**
 * Create or update a user
 */
export function createOrUpdateUser(data: {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  group_name: string;
}): User {
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, avatar_url, group_name, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      group_name = excluded.group_name,
      last_login = excluded.last_login
  `);

  stmt.run(
    data.id,
    data.email,
    data.name,
    data.avatar_url || null,
    data.group_name,
    now,
    now
  );

  return getUserById(data.id)!;
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | null;
}

/**
 * Update user's last login time
 */
export function updateLastLogin(userId: string): void {
  const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
  stmt.run(Date.now(), userId);
}

/**
 * Get all users in a group
 */
export function getUsersByGroup(groupName: string): User[] {
  const stmt = db.prepare('SELECT * FROM users WHERE group_name = ?');
  return stmt.all(groupName) as User[];
}
