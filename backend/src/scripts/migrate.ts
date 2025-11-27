import { db } from '../config/database.js';

console.log('🔄 Running database migrations...');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    group_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_login INTEGER NOT NULL
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_name);`);

console.log('✅ Created users table');

// Create game_progress table
db.exec(`
  CREATE TABLE IF NOT EXISTS game_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    game_date TEXT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    won BOOLEAN NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL,
    max_attempts INTEGER NOT NULL,
    time_seconds INTEGER,
    state_json TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, game_id, game_date)
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_game_progress_user ON game_progress(user_id);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_game_progress_game ON game_progress(game_id, game_date);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_game_progress_completed ON game_progress(completed_at);`);

console.log('✅ Created game_progress table');

// Create leaderboard_stats table
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    period_type TEXT NOT NULL,
    period_key TEXT NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    total_attempts INTEGER NOT NULL DEFAULT 0,
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    average_attempts REAL,
    success_rate REAL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, game_id, period_type, period_key)
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_leaderboard_game_period ON leaderboard_stats(game_id, period_type, period_key);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_leaderboard_success_rate ON leaderboard_stats(success_rate DESC);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_leaderboard_streak ON leaderboard_stats(current_streak DESC);`);

console.log('✅ Created leaderboard_stats table');

// Create ai_image_cache table
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_image_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    language TEXT NOT NULL,
    prompt TEXT NOT NULL,
    image_filename TEXT NOT NULL,
    definition TEXT,
    generated_at INTEGER NOT NULL,
    openai_model TEXT,
    UNIQUE(word, language)
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_cache_word ON ai_image_cache(word, language);`);

console.log('✅ Created ai_image_cache table');

// Create ai_generation_queue table
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_generation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL,
    language TEXT NOT NULL,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_attempt INTEGER,
    error_message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_queue_status ON ai_generation_queue(status, created_at);`);

console.log('✅ Created ai_generation_queue table');

// Create sessions table
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);`);

console.log('✅ Created sessions table');

// Create whitelist table
db.exec(`
  CREATE TABLE IF NOT EXISTS whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    group_name TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    added_by TEXT,
    notes TEXT
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_whitelist_email ON whitelist(email);`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_whitelist_group ON whitelist(group_name);`);

console.log('✅ Created whitelist table');

console.log('🎉 All migrations completed successfully!');

// Close database connection
db.close();
