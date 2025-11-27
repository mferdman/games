# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ferdman Games is a daily word game platform (Wordle-style) with multi-language support (English/Russian), group-based data isolation, and AI-generated images for completed games. Built with React + Vite frontend and Express + SQLite backend.

## Development Commands

### Full Stack Development
```bash
npm run dev              # Start backend + frontend with PM2
npm run dev:logs         # View aggregated logs
npm run dev:stop         # Stop all processes
npm run dev:restart      # Restart all processes
```

### Backend Only
```bash
cd backend
npm run dev              # tsx watch (hot reload)
npm run db:migrate       # Initialize database schema
```

### Frontend Only
```bash
cd frontend
npm run dev              # Vite dev server on port 5173
```

### Database Operations
```bash
sqlite3 data/database.sqlite    # Direct database access
npm run db:migrate              # Run from backend dir
```

## Critical Architecture Patterns

### 1. Plugin-Based Game System

Games are self-registering plugins via a singleton registry pattern. Each game must implement the `GamePlugin` interface:

```typescript
interface GamePlugin {
  getConfig(): GameConfig
  initializeGame(userId: string, gameDate?: string): Promise<GameState>
  validateMove(state: GameState, move: any): Promise<MoveValidation>
  processMove(state: GameState, move: any): Promise<GameState>
  getAIContent?(state: GameState): Promise<AIContentRequest | null>
}
```

**Location:** `backend/src/games/index.ts` (registry), `backend/src/games/ferdle.ts` (implementation)

**Key Points:**
- Games register themselves at module initialization
- Each game has its own word lists loaded from JSON
- State data is polymorphic - each game defines its own structure stored in `state_json`
- Game IDs must be unique across all plugins

### 2. Deterministic Daily Word Selection

Uses `seedrandom` library with date string as seed to ensure everyone gets the same word:

```typescript
private getDailyWord(date: string): string {
  const rng = seedrandom(date);  // "2025-11-27" -> deterministic RNG
  const index = Math.floor(rng() * this.targets.length);
  return this.targets[index];
}
```

**Why this matters:**
- No database storage needed for daily words
- Reproducible across server restarts
- Can calculate future/past words deterministically
- Date must be in EST/EDT timezone (handled by `getTodayDateEST()`)

### 3. Group-Based Data Isolation

All data is isolated by `group_name` for multi-tenant support:

**Authentication Flow:**
1. User authenticates via Google OAuth
2. Email checked against whitelist (`data/whitelist.txt`)
3. Group assignment from whitelist stored in session and database
4. All queries filtered by `group_name` at database level

**Critical Files:**
- `backend/src/services/whitelist.service.ts` - In-memory cache with file backup
- `backend/src/middleware/auth.ts` - Session management
- `backend/src/services/leaderboard.service.ts` - GROUP BY filtering

**Security Note:** The target word is NEVER sent to the client until game completion. In responses, `stateData.targetWord` is explicitly set to `undefined` unless `isComplete === true`.

### 4. Proactive AI Image Generation

Images are pre-generated in the background when a game starts (not when won) to reduce completion latency:

**Stage 1 - Game Start (Non-blocking):**
```typescript
// In game.routes.ts GET /:gameId/state
if (!state.isComplete && game.getAIContent) {
  const tempState = { ...state, won: true };
  const aiContent = await game.getAIContent(tempState);
  queueImageGeneration(aiContent);  // Fire and forget
}
```

**Stage 2 - Game Completion (Synchronous):**
- Check `ai_image_cache` table first
- Generate if missing (fallback)
- Return placeholder on failure

**Caching Strategy:**
- Database cache: word + language → filename
- Filesystem: `/data/images/ai-generated/{language}/{word}_{hash}.png`
- Cache-first strategy reduces OpenAI API costs

**Prompt Engineering:**
- Uses definition/concept, NOT the word itself (AI is bad at spelling)
- Language-specific prompts (English in `buildPrompt()`, Russian with Cyrillic instructions)
- Explicit instruction: "Do NOT include any text or words in the image itself"
- "Use the most obvious and straightforward interpretation" to reduce ambiguity

**Location:** `backend/src/services/ai.service.ts`

### 5. Wordle Algorithm with Duplicate Handling

The clue generation uses a **two-pass algorithm** (critical for correctness):

**Pass 1:** Mark all CORRECT letters (green)
- Compare position-by-position
- Decrement letter frequency counts

**Pass 2:** Mark PRESENT letters (yellow)
- Only for letters not already correct
- Use remaining frequency counts

**Example:** Target="ROBOT", Guess="FLOOR"
- First O → green (position match)
- Second O → gray (only one O left after green match)

**Location:** `backend/src/games/ferdle.ts` in `processMove()`

### 6. Error Handling Convention

Validation errors return `200 OK` with an `error` field (not 4xx status codes):

```typescript
// Backend
if (validationErrors.some(err => error.message.includes(err))) {
  return res.json({ error: error.message });
}

// Frontend
if ((result as any).error) {
  setError((result as any).error);
  return;
}
```

**Why:** Enables inline error messages without exception handling in the frontend. UI shows validation errors temporarily (2-second timeout) without treating them as network failures.

**Location:** `backend/src/routes/game.routes.ts`, `frontend/src/pages/FerdlePage.tsx`

## Database Schema Notes

### better-sqlite3 Configuration
- **WAL mode** enabled for better concurrency
- **Synchronous** API (faster than async for SQLite)
- Session store uses SQLite (not Redis) for simpler deployment

### Key Tables

**game_progress:**
- Unique constraint: `(user_id, game_id, game_date)`
- `state_json` stores game-specific polymorphic data
- Foreign key cascade delete on user

**leaderboard_stats:**
- Pre-aggregated statistics (not calculated on-demand)
- Period keys: "2025-11-27" (daily), "2025-W48" (weekly), "2025-11" (monthly), "all" (all-time)
- Updated incrementally on game completion

**ai_image_cache:**
- Cache key: `(word, language)`
- Stores prompt used for reproducibility
- Filename format: `{word}_{hash}.png`

**whitelist:**
- Synced from `data/whitelist.txt` at startup
- In-memory Map for O(1) lookup
- Format: `email,groupName` per line

## API Conventions

### Authentication
- Cookie-based sessions (30-day expiry)
- `withCredentials: true` required in axios config
- `requireAuth` middleware on protected routes

### Date Handling
- Server uses **America/New_York timezone** (EST/EDT with automatic DST)
- Client gets date from `GET /api/games/today` endpoint
- Never trust client-supplied dates for daily games

### Image Serving
- Route: `GET /api/images/:language/:filename`
- Cache-Control: `public, max-age=31536000, immutable`
- Requires authentication even though cached forever

## Frontend Architecture

### State Management
- **No Redux/Zustand** - React Context for auth only
- Game state managed locally in page components
- API calls via service layer (`services/api.service.ts`)

### Component Structure
- `pages/` - Route-level components (HomePage, FerdlePage)
- `components/common/` - Reusable UI (Modal, Button)
- `components/games/ferdle/` - Game-specific components (Board, Keyboard, CompletionModal)

### Modal Layout (Recent Fix)
The completion modal uses a specific flexbox pattern to handle image letterboxing:

```tsx
<Modal> {/* h-[90vh] flex flex-col overflow-hidden */}
  <Header className="flex-shrink-0" />
  <ImageContainer className="flex-1 h-0 min-h-0 min-w-0"> {/* Critical! */}
    <img className="max-w-full max-h-full object-contain" />
  </ImageContainer>
  <Buttons className="flex-shrink-0" />
</Modal>
```

**Why `h-0 min-h-0 min-w-0`?**
- Flex items default to `min-width: auto` causing overflow
- `h-0` gives base height for flex-1 to grow from
- `min-h-0 min-w-0` allows proper shrinking below content size
- Enables `max-h-full` on image to work correctly with percentage-based sizing

**Location:** `frontend/src/components/common/Modal.tsx`, `frontend/src/components/games/ferdle/CompletionModal.tsx`

## Adding a New Game

1. **Create game plugin** in `backend/src/games/your-game.ts`
   - Implement `GamePlugin` interface
   - Load word lists or game assets
   - Implement game logic in `processMove()`

2. **Register game** in `backend/src/games/index.ts`
   ```typescript
   import { yourGame } from './your-game.js';
   gameRegistry.register(yourGame);
   ```

3. **Add frontend route** in `frontend/src/App.tsx`
   ```tsx
   <Route path="/your-game" element={<YourGamePage />} />
   ```

4. **Update home page** to list new game in `frontend/src/pages/HomePage.tsx`

5. **Optional: Add AI integration**
   - Implement `getAIContent()` method
   - Return `{ word, definition, language }`
   - Images auto-generated and cached

## Environment Variables

### Backend (.env)
```bash
PORT=3001
DATABASE_PATH=./data/database.sqlite
WHITELIST_PATH=./data/whitelist.txt
SESSION_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=sk-...
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3001
```

## Production Deployment

Uses PM2 for process management:

```bash
npm run build                              # Build both frontend and backend
pm2 start ecosystem.prod.config.js --env production
pm2 save
pm2 startup                                # Configure auto-start
```

**Production Differences:**
- Frontend served as static files from backend (Express static middleware)
- No separate Vite dev server
- Separate PM2 ecosystem config with production env vars

## Testing Notes

- No test framework currently configured
- Manual testing via PM2 logs: `npm run dev:logs`
- Backend logs via Winston to console
- Frontend errors visible in browser DevTools

## Common Gotchas

1. **ES Modules everywhere**: Use `.js` extensions in imports, even for `.ts` files
2. **Date timezone**: Always use server date from API, not client local date
3. **Session cookies**: Must use `withCredentials: true` in axios
4. **Group isolation**: All queries must filter by group_name for security
5. **AI prompts**: Never include the actual word to avoid spelling errors
6. **Image sizing in modals**: Use the specific flexbox pattern with `h-0 min-h-0 min-w-0`
7. **Validation errors**: Return 200 OK with error field, don't throw or return 400
8. **Word lists**: Dictionary (all valid) separate from targets (answer pool)
