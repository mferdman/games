// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  groupName: string;
}

// Game types
export interface GameConfig {
  id: string;
  name: string;
  description: string;
  category: 'word' | 'math' | 'geography' | 'logic' | 'trivia' | 'other';
  playMode: 'daily' | 'unlimited';
  maxAttempts: number | null;
  supportsLeaderboard: boolean;
  usesAI: boolean;
  metadata: Record<string, any>;
}

export interface GameState {
  gameId: string;
  userId: string;
  gameDate: string | null;
  isComplete: boolean;
  won: boolean;
  attempts: number;
  maxAttempts: number;
  startedAt: number;
  completedAt: number | null;
  timeSeconds: number | null;
  stateData: any;
}

// Ferdle types
export interface FerdleGuess {
  word: string;
  clues: ('correct' | 'present' | 'absent')[];
}

export interface FerdleState {
  guesses: FerdleGuess[];
  letterStates: Record<string, 'correct' | 'present' | 'absent'>;
  language: 'en' | 'ru';
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  success_rate: number;
  current_streak: number;
  best_streak: number;
  average_attempts: number | null;
}
