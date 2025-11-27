import { db } from '../config/database.js';
import { gameRegistry } from '../games/index.js';
import type { GameState } from '../games/types.js';
import type { GameProgress } from '../models/types.js';
import { queueImageGeneration } from './ai.service.js';

/**
 * Load game state from database
 */
export function loadGameState(
  userId: string,
  gameId: string,
  gameDate: string | null
): GameState | null {
  const stmt = db.prepare(`
    SELECT * FROM game_progress
    WHERE user_id = ? AND game_id = ? AND game_date IS ?
  `);

  const row = stmt.get(userId, gameId, gameDate) as GameProgress | undefined;

  if (!row) {
    return null;
  }

  // Deserialize state
  const stateData = row.state_json ? JSON.parse(row.state_json) : {};

  return {
    gameId: row.game_id,
    userId: row.user_id,
    gameDate: row.game_date,
    isComplete: !!row.completed_at,
    won: row.won,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    timeSeconds: row.time_seconds,
    stateData,
  };
}

/**
 * Save game state to database
 */
export function saveGameState(state: GameState): void {
  const now = Date.now();
  const timeSeconds = state.completedAt
    ? Math.floor((state.completedAt - state.startedAt) / 1000)
    : null;

  const stmt = db.prepare(`
    INSERT INTO game_progress (
      user_id, game_id, game_date, started_at, completed_at,
      won, attempts, max_attempts, time_seconds, state_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, game_id, game_date) DO UPDATE SET
      completed_at = excluded.completed_at,
      won = excluded.won,
      attempts = excluded.attempts,
      time_seconds = excluded.time_seconds,
      state_json = excluded.state_json
  `);

  stmt.run(
    state.userId,
    state.gameId,
    state.gameDate,
    state.startedAt,
    state.completedAt,
    state.won ? 1 : 0,
    state.attempts,
    state.maxAttempts,
    timeSeconds,
    JSON.stringify(state.stateData)
  );
}

/**
 * Get or create game state
 */
export async function getOrCreateGame(
  userId: string,
  gameId: string,
  gameDate?: string
): Promise<GameState> {
  const game = gameRegistry.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const config = game.getConfig();

  // For daily games, use the provided date or today's date
  let finalGameDate: string | null = null;
  if (config.playMode === 'daily') {
    finalGameDate = gameDate || getTodayDateEST();

    // Validate date to prevent spoofing
    if (gameDate) {
      validateGameDate(gameDate);
    }
  }

  // Try to load existing game
  let state = loadGameState(userId, gameId, finalGameDate);

  if (!state) {
    // Create new game
    state = await game.initializeGame(userId, finalGameDate || undefined);
    saveGameState(state);
  }

  // Queue AI image generation in background for instant win experience
  // Only queue if game supports AI content and game isn't already complete
  if (!state.isComplete && game.getAIContent) {
    // Temporarily set won to true to get AI content request
    const tempState = { ...state, won: true };
    const aiContent = await game.getAIContent(tempState);
    if (aiContent) {
      queueImageGeneration(aiContent);
    }
  }

  return state;
}

/**
 * Process a move in a game
 */
export async function processGameMove(
  userId: string,
  gameId: string,
  move: any,
  gameDate?: string
): Promise<{ state: GameState; aiContent?: any }> {
  const game = gameRegistry.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  // Get current game state
  let state = await getOrCreateGame(userId, gameId, gameDate);

  if (state.isComplete) {
    throw new Error('Game is already complete');
  }

  // Validate move
  const validation = await game.validateMove(state, move);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid move');
  }

  // Process move
  state = await game.processMove(state, move);

  // Check if game just completed
  if (state.isComplete && !state.completedAt) {
    state.completedAt = Date.now();
  }

  // Save updated state
  saveGameState(state);

  // If game completed and won, get AI content (if supported)
  let aiContent = undefined;
  if (state.isComplete && state.won && game.getAIContent) {
    aiContent = await game.getAIContent(state);
  }

  return { state, aiContent };
}

/**
 * Get user's game history
 */
export function getUserGameHistory(
  userId: string,
  gameId?: string,
  limit: number = 50,
  offset: number = 0
): GameProgress[] {
  let query = `
    SELECT * FROM game_progress
    WHERE user_id = ?
  `;

  const params: any[] = [userId];

  if (gameId) {
    query += ` AND game_id = ?`;
    params.push(gameId);
  }

  query += ` ORDER BY started_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  return stmt.all(...params) as GameProgress[];
}

/**
 * Get today's date in EST/EDT timezone as YYYY-MM-DD
 * Uses America/New_York timezone which automatically handles DST
 */
function getTodayDateEST(): string {
  const now = new Date();

  // Use Intl.DateTimeFormat to get date in America/New_York timezone (handles DST automatically)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;

  return `${year}-${month}-${day}`;
}

/**
 * Validate game date to prevent spoofing attacks
 * - Rejects future dates
 * - Rejects dates >30 days old
 */
function validateGameDate(date: string): void {
  const today = getTodayDateEST();
  const requestedDate = new Date(date + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');

  // Reject future dates
  if (requestedDate > todayDate) {
    throw new Error('Cannot play future games');
  }

  // Reject dates more than 30 days old
  const thirtyDaysAgo = new Date(todayDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (requestedDate < thirtyDaysAgo) {
    throw new Error('Date too far in past (max 30 days)');
  }
}

/**
 * Get today's date in EST
 */
export function getToday(): string {
  return getTodayDateEST();
}
