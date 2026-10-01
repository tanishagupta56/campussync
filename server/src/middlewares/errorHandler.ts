import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred. Please try again.';

  if (status >= 500) {
    console.error('[ServerError]', err);
  }

  res.status(status).json({
    error: err.name || 'Error',
    message: status >= 500 ? 'An unexpected server error occurred.' : message,
  });
}
