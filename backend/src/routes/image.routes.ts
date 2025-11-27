import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getImagePath } from '../services/ai.service.js';

const router = express.Router();

/**
 * Serve AI-generated images
 */
router.get('/:language/:filename', requireAuth, (req, res) => {
  const { language, filename } = req.params;

  const filepath = getImagePath(language, filename);

  if (!filepath) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Set cache headers (images are immutable)
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  res.sendFile(filepath);
});

/**
 * Serve placeholder image
 */
router.get('/placeholder', (req, res) => {
  // For now, just return 404. In production, serve an actual placeholder image.
  res.status(404).json({ message: 'Placeholder image not implemented' });
});

export default router;
