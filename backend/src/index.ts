import express from 'express';
import session from 'express-session';
import cors from 'cors';
import createSqliteSessionStore from 'better-sqlite3-session-store';
import passport from './config/passport.js';
import { env, paths } from './config/env.js';
import { db } from './config/database.js';
import { requestLogger } from './middleware/logging.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import gameRoutes from './routes/game.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import imageRoutes from './routes/image.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Import game plugins
import { gameRegistry } from './games/index.js';
import { ferdleEnglish, ferdleRussian } from './games/ferdle/index.js';

// Register games
gameRegistry.register(ferdleEnglish);
gameRegistry.register(ferdleRussian);

console.log('🎮 Registered games:');
gameRegistry.getAllConfigs().forEach((config) => {
  console.log(`  - ${config.name} (${config.id})`);
});

// Create Express app
const app = express();

// SQLite session store
const SqliteSessionStore = createSqliteSessionStore(session);

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Session configuration
app.use(
  session({
    store: new SqliteSessionStore({
      client: db,
      expired: {
        clear: true,
        intervalMs: 900000, // 15 minutes
      },
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/auth', authRoutes);        // Google OAuth routes
app.use('/api/auth', authRoutes);    // Auth API routes
app.use('/api/games', gameRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`📁 Data directory: ${paths.data}`);
  console.log(`\n✅ Game platform backend ready!\n`);
});
