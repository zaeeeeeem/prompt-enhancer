/**
 * Enhance Routes
 * Defines routes for the prompt enhancement API
 */

import { Router } from 'express';
import { enhancePrompt, healthCheck } from '../controllers/enhance.controller';
import { validateEnhanceInput, validateContentType } from '../middleware/validateInput';
import { enhanceRateLimiter } from '../middleware/rateLimit';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /enhance
 * Main endpoint for enhancing prompts
 *
 * Request body: { originalPrompt: string }
 * Response: { enhancedPrompt: string, usage: TokenUsage, latencyMs: number }
 *
 * Middleware applied:
 * - Rate limiting (10 req/min per IP)
 * - Content-Type validation (must be application/json)
 * - Input validation (originalPrompt must be valid)
 */
router.post(
  '/enhance',
  enhanceRateLimiter,
  validateContentType,
  validateEnhanceInput,
  asyncHandler(enhancePrompt)
);

/**
 * GET /health
 * Health check endpoint
 * Returns server status and configuration
 */
router.get('/health', asyncHandler(healthCheck));

export default router;
