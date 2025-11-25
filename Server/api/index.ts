/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel's serverless platform
 */

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import enhanceRoutes from '../src/routes/enhance.route';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler';
import { globalRateLimiter } from '../src/middleware/rateLimit';
import logger from '../src/utils/logger';

// Load environment variables
dotenv.config();

/**
 * Creates and configures the Express application
 */
const createApp = (): Application => {
  const app = express();

  // Trust proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'chrome-extension://*';

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (direct browser access, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Allow chrome extension origins
        if (origin.startsWith('chrome-extension://')) {
          return callback(null, true);
        }

        // Check if origin matches exact allowed origin
        if (origin === allowedOrigin) {
          return callback(null, true);
        }

        // For development, also allow localhost
        if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
          return callback(null, true);
        }

        logger.warn('CORS blocked request from unauthorized origin', { origin });
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: false,
      maxAge: 86400,
    })
  );

  // Body parser middleware
  app.use(
    express.json({
      limit: process.env.MAX_BODY_SIZE || '5kb',
      strict: true,
    })
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.MAX_BODY_SIZE || '5kb',
    })
  );

  // Global rate limiter
  app.use(globalRateLimiter);

  // Request logging
  app.use((req: Request, _res: Response, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'PromptEnhance Backend',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        enhance: 'POST /enhance',
        health: 'GET /health',
      },
    });
  });

  // Mount API routes
  app.use('/', enhanceRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

// Create and export the app
const app = createApp();

// Export for Vercel serverless functions
export default app;
