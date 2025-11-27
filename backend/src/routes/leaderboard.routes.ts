import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getLeaderboard, getUserRank } from '../services/leaderboard.service.js';

const router = express.Router();

/**
 * Get leaderboard for a game and period
 */
router.get('/:gameId/:period', requireAuth, (req, res, next) => {
  try {
    const { gameId, period } = req.params;
    const groupName = req.user!.groupName;
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboard = getLeaderboard(gameId, period, groupName, limit);

    res.json({ leaderboard });
  } catch (error: any) {
    if (error.message.includes('Invalid period type')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * Get user's rank and stats
 */
router.get('/:gameId/:period/me', requireAuth, (req, res, next) => {
  try {
    const { gameId, period } = req.params;
    const userId = req.user!.id;
    const groupName = req.user!.groupName;

    const userRank = getUserRank(userId, gameId, period, groupName);

    res.json({ userRank });
  } catch (error: any) {
    if (error.message.includes('Invalid period type')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
