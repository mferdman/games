import type { Request, Response, NextFunction } from 'express';

/**
 * Simple request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    const log = `${method} ${path} ${statusCode} ${duration}ms`;

    if (statusCode >= 500) {
      console.error(`❌ ${log}`);
    } else if (statusCode >= 400) {
      console.warn(`⚠️  ${log}`);
    } else {
      console.log(`✅ ${log}`);
    }
  });

  next();
}
