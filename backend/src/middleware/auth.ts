import type { Request, Response, NextFunction } from 'express';
import type { SessionUser } from '../models/types.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
  }
}

/**
 * Middleware to attach user to request (optional auth)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // User will be available in req.user if authenticated
  next();
}
