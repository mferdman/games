import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { reloadWhitelist } from '../services/whitelist.service.js';

const router = express.Router();

/**
 * Reload whitelist from file
 */
router.post('/whitelist/reload', requireAuth, (req, res) => {
  // TODO: Add admin check
  try {
    reloadWhitelist();
    res.json({ message: 'Whitelist reloaded successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get AI generation queue status
 */
router.get('/queue', requireAuth, (req, res) => {
  // TODO: Implement queue status
  res.json({ queue: [] });
});

export default router;
