/**
 * Rate limiting middleware
 * Limits requests to 10 per minute per IP (matching Gemini Flash-Lite RPM limit)
 */

import rateLimit from 'express-rate-limit';
import { ErrorResponse } from '../types/EnhanceTypes';

/**
 * Rate limiter configuration
 * Max 10 requests per minute per IP address
 */
export const enhanceRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10), // Max requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Custom message
  handler: (_req, res) => {
    const errorResponse: ErrorResponse = {
      error: true,
      message: 'Too many requests. Please try again later.',
    };
    res.status(429).json(errorResponse);
  },

  // Skip successful requests from count (optional - set to false to count all)
  skipSuccessfulRequests: false,

  // Skip failed requests from count (optional - set to false to count all)
  skipFailedRequests: false,

  // Key generator (use IP address)
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
});

/**
 * Global rate limiter for all endpoints
 * More lenient than the enhance endpoint limiter
 */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Max 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, res) => {
    const errorResponse: ErrorResponse = {
      error: true,
      message: 'Too many requests from this IP. Please try again later.',
    };
    res.status(429).json(errorResponse);
  },
});
