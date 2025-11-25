/**
 * Express Application Configuration
 * Sets up middleware, routes, and error handling
 */

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import enhanceRoutes from './routes/enhance.route';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimit';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

/**
 * Creates and configures the Express application
 * @returns Configured Express app instance
 */
const createApp = (): Application => {
  const app = express();

  // Trust proxy (important for rate limiting and IP detection)
  app.set('trust proxy', 1);

  // Security middleware - Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Not needed for API
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration - Only allow Chrome extension origins
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'chrome-extension://*';

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests) in development
        if (!origin && process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }

        // Check if origin matches chrome-extension pattern
        if (origin && origin.startsWith('chrome-extension://')) {
          return callback(null, true);
        }

        // Check if origin matches exact allowed origin
        if (origin === allowedOrigin) {
          return callback(null, true);
        }

        // For development, also allow localhost
        if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
          return callback(null, true);
        }

        // Reject other origins
        logger.warn('CORS blocked request from unauthorized origin', { origin });
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: false,
      maxAge: 86400, // 24 hours
    })
  );

  // Body parser middleware with size limit
  app.use(
    express.json({
      limit: process.env.MAX_BODY_SIZE || '5kb',
      strict: true,
    })
  );

  // URL-encoded body parser (for form data if needed)
  app.use(
    express.urlencoded({
      extended: true,
      limit: process.env.MAX_BODY_SIZE || '5kb',
    })
  );

  // Global rate limiter
  app.use(globalRateLimiter);

  // Request logging middleware
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

  // 404 handler - must be after all routes
  app.use(notFoundHandler);

  // Global error handler - must be last
  app.use(errorHandler);

  return app;
};

export default createApp;
