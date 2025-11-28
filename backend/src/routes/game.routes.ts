import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { gameRegistry } from '../games/index.js';
import {
  getOrCreateGame,
  processGameMove,
  getUserGameHistory,
  getToday,
} from '../services/game.service.js';
import { updateLeaderboardStats } from '../services/leaderboard.service.js';
import { generateAIImage } from '../services/ai.service.js';

const router = express.Router();

/**
 * Get all available games
 */
router.get('/', requireAuth, (req, res) => {
  const games = gameRegistry.getAllConfigs();
  res.json({ games });
});

/**
 * Get or create game state for user
 */
router.get('/:gameId/state', requireAuth, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { date } = req.query;
    const userId = req.user!.id;

    const gameDate = date as string | undefined;

    const state = await getOrCreateGame(userId, gameId, gameDate);

    // Don't send the target word to the client unless game is complete
    const clientState = {
      ...state,
      stateData: {
        ...state.stateData,
        targetWord: state.isComplete ? state.stateData.targetWord : undefined,
      },
    };

    // If game is complete and won, get AI image from cache
    let aiImage;
    if (state.isComplete && state.won) {
      const game = gameRegistry.get(gameId);
      if (game && game.getAIContent) {
        const aiContent = await game.getAIContent(state);
        if (aiContent) {
          const aiResult = await generateAIImage(aiContent);
          aiImage = aiResult;
        }
      }
    }

    res.json({ state: clientState, aiImage });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Game date is required')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

/**
 * Submit a move
 */
router.post('/:gameId/move', requireAuth, async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { move, date } = req.body;
    const userId = req.user!.id;

    const result = await processGameMove(userId, gameId, move, date);

    // If game just completed, update leaderboard
    if (result.state.isComplete && result.state.completedAt) {
      const groupName = req.user!.groupName;
      updateLeaderboardStats(
        userId,
        gameId,
        result.state.won,
        result.state.attempts,
        result.state.timeSeconds || 0,
        groupName
      );

      // Generate AI image if won
      if (result.aiContent) {
        const aiResult = await generateAIImage(result.aiContent);
        (result as any).aiImage = aiResult;
      }
    }

    // Hide target word from client unless game is complete
    const clientState = {
      ...result.state,
      stateData: {
        ...result.state.stateData,
        targetWord: result.state.isComplete ? result.state.stateData.targetWord : undefined,
      },
    };

    res.json({
      state: clientState,
      aiImage: (result as any).aiImage,
    });
  } catch (error: any) {
    // Validation errors - return 200 with error field
    const validationErrors = [
      'Invalid move',
      'Game is already complete',
      'Not a word',
      'Already guessed',
      'Guess must be',
      'Word must be'
    ];

    if (validationErrors.some(err => error.message.includes(err))) {
      return res.json({ error: error.message });
    }
    next(error);
  }
});

/**
 * Get user's game history
 */
router.get('/:gameId/history', requireAuth, (req, res) => {
  const { gameId } = req.params;
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const history = getUserGameHistory(userId, gameId, limit, offset);

  res.json({ history });
});

/**
 * Get today's date (for checking if daily game is available)
 */
router.get('/today', (req, res) => {
  res.json({ date: getToday() });
});

export default router;
