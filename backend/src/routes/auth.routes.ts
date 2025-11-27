import express from 'express';
import passport from '../config/passport.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${env.FRONTEND_URL}/unauthorized`,
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(env.FRONTEND_URL);
  }
);

/**
 * Get current authenticated user
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
  });
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session destruction failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
});

export default router;
