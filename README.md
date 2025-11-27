# Ferdman Games

A complete game framework platform with Ferdle (word-guessing games) as the first implementation. Built with React, TypeScript, Node.js, Express, SQLite, Google OAuth, and OpenAI integration.

## Features

- **Game Framework**: Modular plugin-based system for multiple game types
- **Ferdle Games**: English (5-letter) and Russian (4-letter) word-guessing games
- **User Authentication**: Google OAuth with whitelist-based access control
- **Group Isolation**: Complete data isolation between user groups
- **Leaderboards**: Comprehensive ranking system with multiple time periods
- **AI Integration**: OpenAI DALL-E 3 for educational word illustrations
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (fast dev server with HMR)
- Tailwind CSS for responsive design
- React Router v6
- Axios for API calls

### Backend
- Node.js 20+ with TypeScript
- Express.js
- SQLite3 with better-sqlite3
- Passport.js (Google OAuth)
- OpenAI SDK for DALL-E 3
- PM2 for process management

## Prerequisites

- Node.js 20+ LTS
- npm or yarn
- PM2 (`npm install -g pm2`)
- Google Cloud OAuth credentials
- OpenAI API key

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
7. Copy Client ID and Client Secret

### 2. OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Copy the API key

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

cd ..
```

### 4. Configure Environment Variables

**Backend** - Edit `/home/mike/games/backend/.env`:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-random-string-change-this

# Google OAuth (replace with your credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# OpenAI (replace with your API key)
OPENAI_API_KEY=sk-your-openai-api-key

# Data directory
DATA_DIR=../data
```

### 5. Configure Whitelist

Edit `/home/mike/games/data/whitelist.txt`:

```
# Format: email,groupname
your-email@gmail.com,admin
friend@example.com,family1
```

### 6. Initialize Database

```bash
cd backend
npm run db:migrate
```

This will create all necessary database tables.

### 7. Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts both backend (port 3000) and frontend (port 5173) using PM2.

**View logs:**
```bash
npm run dev:logs
```

**Monitor processes:**
```bash
npm run dev:monit
```

**Stop servers:**
```bash
npm run dev:stop
```

## Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Google OAuth**: http://localhost:3000/auth/google

## Testing

The project includes a comprehensive test suite to catch regressions and ensure code quality.

### Backend Tests

**Run all tests:**
```bash
cd backend
npm test
```

**Run specific test types:**
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
```

**Watch mode (re-runs on file changes):**
```bash
npm run test:watch
```

**With coverage report:**
```bash
npm run test:coverage
```

**Current Test Coverage (56 tests):**
- ✅ Database schema and constraints (25 tests)
- ✅ Wordle algorithm and duplicate letter handling (12 tests)
- ✅ Leaderboard rankings and float precision (6 tests)
- ✅ Security and group isolation (6 tests)
- ✅ Race conditions and date validation (7 tests)

### Frontend Tests

**Run all tests:**
```bash
cd frontend
npm test
```

**Watch mode:**
```bash
npm run test:watch
```

**With coverage:**
```bash
npm run test:coverage
```

**Note:** Frontend tests use MSW (Mock Service Worker) to intercept API calls, so no backend server is needed.

### Test Files Location

```
tests/
├── backend/
│   ├── setup/                    # Test utilities and helpers
│   │   ├── testDatabase.ts      # In-memory SQLite setup
│   │   ├── testAuth.ts          # Auth bypass utilities
│   │   └── setupTests.ts        # Global test setup
│   ├── unit/                    # Unit tests
│   │   ├── games/               # Game logic tests
│   │   └── services/            # Service tests
│   ├── integration/             # Integration tests
│   │   ├── database/            # Database schema tests
│   │   └── security/            # Security tests
│   └── e2e/                     # End-to-end tests
│       └── race-conditions.test.ts
└── frontend/
    ├── setup/                   # Frontend test setup
    │   └── msw/                 # Mock Service Worker config
    └── components/              # Component tests
```

### What The Tests Cover

**Database Integrity:**
- Unique constraints (email, user+game+date)
- Foreign key relationships
- Cascade deletion
- Index existence

**Game Logic:**
- Wordle algorithm correctness
- Duplicate letter handling (ROBOT vs FLOOR)
- Clue generation accuracy
- Input validation

**Security:**
- Group-based data isolation
- Leaderboard filtering by group
- Date spoofing prevention
- Cross-tenant protection

**Leaderboard:**
- Float precision in rankings (0.666666... handling)
- Success rate calculations
- Tie-breaking logic
- Rank calculations within groups

**Edge Cases:**
- Concurrent operations
- Invalid input handling
- Boundary conditions
- Error scenarios

### Running Tests in CI/CD

Tests are designed to run in CI/CD pipelines. They use in-memory SQLite databases for speed and complete isolation between tests.

**Example GitHub Actions workflow:**
```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm install
    npm test

- name: Run Frontend Tests
  run: |
    cd frontend
    npm install
    npm test
```

## Project Structure

```
/home/mike/games/
├── backend/                    # Express backend
│   ├── src/
│   │   ├── config/            # Database, Passport, environment
│   │   ├── middleware/        # Auth, logging, error handling
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── games/             # Game plugins
│   │   │   └── ferdle/        # Ferdle implementation
│   │   ├── models/            # TypeScript types
│   │   ├── scripts/           # Database migration
│   │   └── index.ts           # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── layout/        # Header, Container
│   │   │   ├── common/        # Button, Card, Modal
│   │   │   └── games/ferdle/  # Ferdle components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context (Auth)
│   │   ├── services/          # API service
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── vite.config.ts
├── data/                       # Data directory
│   ├── database.sqlite        # SQLite database
│   ├── whitelist.txt          # User whitelist
│   ├── game-assets/           # Game word lists
│   └── images/ai-generated/   # AI images
├── ecosystem.config.js         # PM2 dev config
└── package.json                # Root package.json
```

## Playing Ferdle

1. Log in with your Google account (must be whitelisted)
2. Click on "Ferdle" or "Фердл" from the home page
3. Guess the word:
   - **Green**: Correct letter in correct position
   - **Yellow**: Correct letter in wrong position
   - **Gray**: Letter not in word
4. You have 10 attempts
5. On win, you'll see an AI-generated educational image!

## Leaderboard

- View rankings for your group
- Filter by time period: Daily, Weekly, Monthly, All Time
- Metrics: Win Rate, Streak, Average Attempts
- Complete data isolation between groups

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate OAuth flow
- `GET /auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Games
- `GET /api/games` - List all games
- `GET /api/games/:gameId/state` - Get/create game state
- `POST /api/games/:gameId/move` - Submit a move

### Leaderboard
- `GET /api/leaderboards/:gameId/:period` - Get leaderboard
- `GET /api/leaderboards/:gameId/:period/me` - Get user's rank

### Images
- `GET /api/images/:language/:filename` - Serve AI images

### Admin
- `POST /api/admin/whitelist/reload` - Reload whitelist

## Production Deployment

### 1. Build

```bash
npm run build
```

### 2. Configure Production Environment

Update `backend/.env` with production values:
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Update OAuth callback URL
- Set production domain

### 3. Start with PM2

```bash
pm2 start ecosystem.prod.config.js --env production
pm2 save
pm2 startup
```

### 4. Set Up Nginx Reverse Proxy

Example nginx config:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 5. Enable HTTPS with Let's Encrypt

```bash
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Database Issues

If you encounter database errors, try:

```bash
cd backend
rm -f ../data/database.sqlite
npm run db:migrate
```

### Port Already in Use

Stop PM2 processes:

```bash
npm run dev:stop
pm2 kill
```

### OAuth Redirect Mismatch

Ensure your Google OAuth callback URL matches exactly what's in `.env` and Google Cloud Console.

### AI Image Generation Fails

- Check OpenAI API key is valid
- Check API quota/billing
- Images will show placeholder if generation fails

## Adding New Games

1. Create game plugin in `backend/src/games/yourgame/`
2. Implement `GamePlugin` interface
3. Register in `backend/src/index.ts`
4. Create frontend components in `frontend/src/components/games/yourgame/`
5. Add route in `frontend/src/App.tsx`

## Group Management

To add users to different groups, edit `data/whitelist.txt`:

```
# Family group
alice@example.com,family_smith
bob@example.com,family_smith

# School group
student1@school.edu,class_2024
student2@school.edu,class_2024
```

Users in different groups never see each other's leaderboard data.

## License

MIT

## Support

For issues or questions, please create an issue on GitHub.
