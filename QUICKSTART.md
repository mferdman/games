# Quick Start Guide

## Current Status ✅

The game platform has been successfully set up with:
- ✅ Backend and frontend code complete
- ✅ Dependencies installed
- ✅ Database initialized with all tables
- ✅ Directory structure created

## Next Steps to Run the Application

### 1. Configure Google OAuth (REQUIRED)

You need Google OAuth credentials to enable user login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Navigate to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy your **Client ID** and **Client Secret**

Then update `/home/mike/games/backend/.env`:
```env
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### 2. Configure OpenAI API (REQUIRED for AI images)

To generate AI images when players win:

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Copy the API key

Then update `/home/mike/games/backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Note**: If you don't have an OpenAI API key, the game will still work, but you won't see AI-generated images when winning.

### 3. Add Your Email to Whitelist (REQUIRED)

Edit `/home/mike/games/data/whitelist.txt` and add your Google email:

```
# Format: email,groupname
your-email@gmail.com,admin
```

Replace `your-email@gmail.com` with the email address you'll use to log in with Google.

### 4. Update Session Secret (RECOMMENDED)

For security, change the session secret in `/home/mike/games/backend/.env`:

```env
SESSION_SECRET=your-random-secure-string-here-at-least-32-characters
```

You can generate a random string with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the Application

From `/home/mike/games/`:

```bash
npm run dev
```

This will start:
- **Backend** on http://localhost:3000
- **Frontend** on http://localhost:5173

### 6. Access the Application

Open your browser to: **http://localhost:5173**

You'll be redirected to Google login. After logging in with your whitelisted email, you'll see the game platform!

## Monitoring the Application

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

## Troubleshooting

### "Not whitelisted" error
- Make sure your email is in `/home/mike/games/data/whitelist.txt`
- Restart the backend: `npm run dev:restart`

### OAuth redirect error
- Verify the callback URL in Google Cloud Console matches: `http://localhost:3000/auth/google/callback`
- Check `.env` has the correct `GOOGLE_CALLBACK_URL`

### Port already in use
```bash
npm run dev:stop
pm2 kill
```

### Database errors
```bash
cd backend
npm run db:migrate
```

## Environment Files Summary

All configuration is in `/home/mike/games/backend/.env`:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# REQUIRED: Change these
SESSION_SECRET=your-random-secure-string-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=sk-your-openai-api-key

# These can stay as-is
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
DATA_DIR=../data
```

## Playing Ferdle

Once logged in:
1. Click on "Ferdle" (English) or "Фердл" (Russian)
2. Start guessing!
   - **Green** = correct letter, correct position
   - **Yellow** = correct letter, wrong position
   - **Gray** = letter not in word
3. You have 10 attempts
4. Win to see an AI-generated educational image!

## What's Been Built

This is a complete game platform with:
- ✅ Full authentication system with Google OAuth
- ✅ Group-based access control and data isolation
- ✅ Ferdle word-guessing games (English & Russian)
- ✅ Comprehensive leaderboard system
- ✅ OpenAI DALL-E 3 integration for educational images
- ✅ Responsive design for desktop and mobile
- ✅ TypeScript throughout for type safety

## Need Help?

See the full [README.md](README.md) for detailed documentation.

---

**Ready to play?** Complete steps 1-3 above, then run `npm run dev`!
