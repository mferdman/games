// User model
export interface User {
  id: string;              // Google OAuth ID
  email: string;
  name: string;
  avatar_url: string | null;
  group_name: string;      // User's group from whitelist
  created_at: number;      // Unix timestamp
  last_login: number;      // Unix timestamp
}

// Game progress model
export interface GameProgress {
  id?: number;
  user_id: string;
  game_id: string;         // e.g., 'ferdle-en-5'
  game_date: string | null; // YYYY-MM-DD for daily games, NULL for unlimited
  started_at: number;
  completed_at: number | null;
  won: boolean;
  attempts: number;
  max_attempts: number;
  time_seconds: number | null;
  state_json: string;      // JSON serialized game state
}

// Leaderboard stats model
export interface LeaderboardStats {
  id?: number;
  user_id: string;
  game_id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'all_time';
  period_key: string;      // e.g., '2025-11-27', '2025-W48', '2025-11'
  games_played: number;
  games_won: number;
  total_attempts: number;
  total_time_seconds: number;
  current_streak: number;
  best_streak: number;
  average_attempts: number | null;
  success_rate: number | null;
  updated_at: number;
}

// AI image cache model
export interface AIImageCache {
  id?: number;
  word: string;
  language: string;
  prompt: string;
  image_filename: string;
  definition: string | null;
  generated_at: number;
  openai_model: string | null;
}

// AI generation queue model
export interface AIGenerationQueue {
  id?: number;
  word: string;
  language: string;
  user_id: string;
  game_id: string;
  attempts: number;
  last_attempt: number | null;
  error_message: string | null;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  created_at: number;
}

// Whitelist model
export interface WhitelistEntry {
  id?: number;
  email: string;
  group_name: string;
  added_at: number;
  added_by: string | null;
  notes: string | null;
}

// Session user data
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  groupName: string;
}
