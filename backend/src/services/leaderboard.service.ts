import { db } from '../config/database.js';
import type { LeaderboardStats } from '../models/types.js';

/**
 * Get period key for a given period type and date
 */
function getPeriodKey(periodType: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (periodType) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      // Get ISO week number
      const weekNumber = getISOWeek(date);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${month}`;
    case 'all_time':
      return 'all';
    default:
      throw new Error(`Invalid period type: ${periodType}`);
  }
}

/**
 * Get ISO week number
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Update leaderboard stats when a game completes
 */
export function updateLeaderboardStats(
  userId: string,
  gameId: string,
  won: boolean,
  attempts: number,
  timeSeconds: number,
  groupName: string
): void {
  const now = Date.now();
  const date = new Date(now);

  // Update stats for all period types
  const periodTypes = ['daily', 'weekly', 'monthly', 'all_time'];

  for (const periodType of periodTypes) {
    const periodKey = getPeriodKey(periodType, date);

    // Get existing stats or create new
    const existing = db
      .prepare(
        `
      SELECT * FROM leaderboard_stats
      WHERE user_id = ? AND game_id = ? AND period_type = ? AND period_key = ?
    `
      )
      .get(userId, gameId, periodType, periodKey) as LeaderboardStats | undefined;

    const gamesPlayed = (existing?.games_played || 0) + 1;
    const gamesWon = (existing?.games_won || 0) + (won ? 1 : 0);
    const totalAttempts = (existing?.total_attempts || 0) + attempts;
    const totalTimeSeconds = (existing?.total_time_seconds || 0) + timeSeconds;

    // Calculate metrics
    const successRate = gamesWon / gamesPlayed;
    const averageAttempts = gamesWon > 0 ? totalAttempts / gamesWon : null;

    // Update or insert
    db.prepare(
      `
      INSERT INTO leaderboard_stats (
        user_id, game_id, period_type, period_key,
        games_played, games_won, total_attempts, total_time_seconds,
        current_streak, best_streak, average_attempts, success_rate, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, game_id, period_type, period_key) DO UPDATE SET
        games_played = excluded.games_played,
        games_won = excluded.games_won,
        total_attempts = excluded.total_attempts,
        total_time_seconds = excluded.total_time_seconds,
        average_attempts = excluded.average_attempts,
        success_rate = excluded.success_rate,
        updated_at = excluded.updated_at
    `
    ).run(
      userId,
      gameId,
      periodType,
      periodKey,
      gamesPlayed,
      gamesWon,
      totalAttempts,
      totalTimeSeconds,
      existing?.current_streak || 0,
      existing?.best_streak || 0,
      averageAttempts,
      successRate,
      now
    );
  }
}

/**
 * Get leaderboard for a game and period, filtered by group
 */
export function getLeaderboard(
  gameId: string,
  periodType: string,
  groupName: string,
  limit: number = 10
): any[] {
  const now = Date.now();
  const date = new Date(now);
  const periodKey = getPeriodKey(periodType, date);

  const stmt = db.prepare(`
    SELECT
      ls.*,
      u.name,
      u.email,
      u.avatar_url
    FROM leaderboard_stats ls
    JOIN users u ON ls.user_id = u.id
    WHERE ls.game_id = ?
      AND ls.period_type = ?
      AND ls.period_key = ?
      AND u.group_name = ?
    ORDER BY
      ROUND(ls.success_rate, 6) DESC,
      ls.current_streak DESC,
      ROUND(ls.average_attempts, 6) ASC,
      ls.games_won DESC
    LIMIT ?
  `);

  const rows = stmt.all(gameId, periodType, periodKey, groupName, limit);

  // Add rank
  return rows.map((row: any, index) => ({
    ...row,
    rank: index + 1,
  }));
}

/**
 * Get user's rank and stats for a game and period within their group
 */
export function getUserRank(
  userId: string,
  gameId: string,
  periodType: string,
  groupName: string
): any {
  const now = Date.now();
  const date = new Date(now);
  const periodKey = getPeriodKey(periodType, date);

  // Get user's stats
  const userStats = db
    .prepare(
      `
    SELECT
      ls.*,
      u.name,
      u.email,
      u.avatar_url
    FROM leaderboard_stats ls
    JOIN users u ON ls.user_id = u.id
    WHERE ls.user_id = ?
      AND ls.game_id = ?
      AND ls.period_type = ?
      AND ls.period_key = ?
  `
    )
    .get(userId, gameId, periodType, periodKey);

  if (!userStats) {
    return null;
  }

  // Calculate rank within group
  // Use ROUND() for float comparisons to avoid precision issues
  const userSuccessRate = Math.round((userStats as any).success_rate * 1000000) / 1000000;
  const userAvgAttempts = (userStats as any).average_attempts
    ? Math.round((userStats as any).average_attempts * 1000000) / 1000000
    : null;

  const rank = db
    .prepare(
      `
    SELECT COUNT(*) + 1 as rank
    FROM leaderboard_stats ls
    JOIN users u ON ls.user_id = u.id
    WHERE ls.game_id = ?
      AND ls.period_type = ?
      AND ls.period_key = ?
      AND u.group_name = ?
      AND (
        ROUND(ls.success_rate, 6) > ? OR
        (ROUND(ls.success_rate, 6) = ? AND ls.current_streak > ?) OR
        (ROUND(ls.success_rate, 6) = ? AND ls.current_streak = ? AND ROUND(ls.average_attempts, 6) < ?) OR
        (ROUND(ls.success_rate, 6) = ? AND ls.current_streak = ? AND ROUND(ls.average_attempts, 6) = ? AND ls.games_won > ?)
      )
  `
    )
    .get(
      gameId,
      periodType,
      periodKey,
      groupName,
      userSuccessRate,
      userSuccessRate,
      (userStats as any).current_streak,
      userSuccessRate,
      (userStats as any).current_streak,
      userAvgAttempts,
      userSuccessRate,
      (userStats as any).current_streak,
      userAvgAttempts,
      (userStats as any).games_won
    ) as any;

  return {
    ...userStats,
    rank: rank.rank,
  };
}
