import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';
import { isWhitelisted, getGroupName } from '../services/whitelist.service.js';
import { createOrUpdateUser } from '../services/user.service.js';
import type { SessionUser } from '../models/types.js';

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check whitelist
        if (!isWhitelisted(email)) {
          console.warn(`⛔ Unauthorized login attempt: ${email}`);
          return done(null, false, { message: 'Email not whitelisted' });
        }

        const groupName = getGroupName(email);
        if (!groupName) {
          return done(new Error('Group name not found for whitelisted email'));
        }

        // Create or update user
        const user = createOrUpdateUser({
          id: profile.id,
          email: email,
          name: profile.displayName || 'User',
          avatar_url: profile.photos?.[0]?.value,
          group_name: groupName,
        });

        // Create session user object
        const sessionUser: SessionUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          groupName: user.group_name,
        };

        console.log(`✅ User authenticated: ${email} (${groupName})`);

        return done(null, sessionUser);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error as Error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user: SessionUser, done) => {
  done(null, user);
});

export default passport;
