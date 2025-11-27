import fs from 'fs';
import { paths } from '../config/env.js';
import { db } from '../config/database.js';

// In-memory cache for fast lookups
const whitelistCache = new Map<string, string>(); // email -> groupName

/**
 * Load whitelist from file and sync to database
 */
export function loadWhitelist(): void {
  try {
    console.log('📋 Loading whitelist from:', paths.whitelist);

    // Check if file exists
    if (!fs.existsSync(paths.whitelist)) {
      console.warn('⚠️  Whitelist file not found, creating empty file');
      fs.writeFileSync(paths.whitelist, '# Whitelist format: email,groupname\n');
      return;
    }

    const content = fs.readFileSync(paths.whitelist, 'utf-8');
    const lines = content.split('\n');

    whitelistCache.clear();

    let count = 0;
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse email,groupname
      const parts = trimmed.split(',');
      if (parts.length !== 2) {
        console.warn(`⚠️  Invalid whitelist entry: ${line}`);
        continue;
      }

      const [email, groupName] = parts.map(p => p.trim());

      if (!email || !groupName) {
        console.warn(`⚠️  Invalid whitelist entry: ${line}`);
        continue;
      }

      // Add to cache
      whitelistCache.set(email.toLowerCase(), groupName);

      // Sync to database
      try {
        const now = Date.now();
        db.prepare(`
          INSERT INTO whitelist (email, group_name, added_at)
          VALUES (?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            group_name = excluded.group_name
        `).run(email.toLowerCase(), groupName, now);
      } catch (error) {
        console.error(`Error syncing whitelist entry for ${email}:`, error);
      }

      count++;
    }

    console.log(`✅ Loaded ${count} whitelist entries`);
  } catch (error) {
    console.error('❌ Error loading whitelist:', error);
    throw error;
  }
}

/**
 * Check if an email is whitelisted
 */
export function isWhitelisted(email: string): boolean {
  return whitelistCache.has(email.toLowerCase());
}

/**
 * Get group name for a whitelisted email
 */
export function getGroupName(email: string): string | null {
  return whitelistCache.get(email.toLowerCase()) || null;
}

/**
 * Reload whitelist from file (for admin endpoint)
 */
export function reloadWhitelist(): void {
  console.log('🔄 Reloading whitelist...');
  loadWhitelist();
}

// Load whitelist on module import
loadWhitelist();
