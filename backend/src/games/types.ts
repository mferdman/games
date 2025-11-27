/**
 * Game configuration
 */
export interface GameConfig {
  id: string;
  name: string;
  description: string;
  category: 'word' | 'math' | 'geography' | 'logic' | 'trivia' | 'other';
  playMode: 'daily' | 'unlimited';
  maxAttempts: number | null;  // null means unlimited
  supportsLeaderboard: boolean;
  usesAI: boolean;
  metadata: Record<string, any>;
}

/**
 * Game state (stored in database)
 */
export interface GameState {
  gameId: string;
  userId: string;
  gameDate: string | null;      // YYYY-MM-DD for daily games, null for unlimited
  isComplete: boolean;
  won: boolean;
  attempts: number;
  maxAttempts: number;
  startedAt: number;             // Unix timestamp
  completedAt: number | null;    // Unix timestamp
  timeSeconds: number | null;
  stateData: any;                // Game-specific state (will be JSON serialized)
}

/**
 * Move validation result
 */
export interface MoveValidation {
  valid: boolean;
  error?: string;
}

/**
 * AI content request (for games that use AI)
 */
export interface AIContentRequest {
  word: string;
  definition: string;
  language: string;
}

/**
 * Game plugin interface
 * All games must implement this interface
 */
export interface GamePlugin {
  /**
   * Get game configuration
   */
  getConfig(): GameConfig;

  /**
   * Initialize a new game for a user
   */
  initializeGame(userId: string, gameDate?: string): Promise<GameState>;

  /**
   * Validate a move before processing
   */
  validateMove(state: GameState, move: any): Promise<MoveValidation>;

  /**
   * Process a move and update game state
   */
  processMove(state: GameState, move: any): Promise<GameState>;

  /**
   * Get AI content request (optional, only for games that use AI)
   */
  getAIContent?(state: GameState): Promise<AIContentRequest | null>;
}
