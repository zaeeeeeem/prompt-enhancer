/**
 * Enhance Controller
 * Handles the /enhance endpoint logic
 * Measures latency and coordinates the prompt enhancement flow
 */

import { Request, Response } from 'express';
import geminiService from '../services/gemini.service';
import logger from '../utils/logger';
import { EnhanceRequest, EnhanceResponse } from '../types/EnhanceTypes';

/**
 * Handles POST /enhance requests
 * Receives original prompt, enhances it via Gemini, and returns enhanced version
 */
export const enhancePrompt = async (
  req: Request,
  res: Response
): Promise<void> => {
  const startTime = Date.now();

  try {
    // Extract request body
    const { originalPrompt } = req.body as EnhanceRequest;

    logger.info('Received enhance request', {
      promptLength: originalPrompt.length,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Call Gemini service to enhance the prompt
    const { enhancedPrompt, usage } = await geminiService.enhancePrompt(
      originalPrompt
    );

    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Construct success response
    const response: EnhanceResponse = {
      enhancedPrompt,
      usage,
      latencyMs,
    };

    logger.info('Prompt enhanced successfully', {
      originalLength: originalPrompt.length,
      enhancedLength: enhancedPrompt.length,
      tokensUsed: usage.totalTokens,
      latencyMs,
    });

    // Send response
    res.status(200).json(response);
  } catch (error) {
    // Calculate latency even on error
    const latencyMs = Date.now() - startTime;

    logger.error('Failed to enhance prompt', {
      error: (error as Error).message,
      latencyMs,
    });

    // Pass error to error handler middleware
    throw error;
  }
};

/**
 * Health check endpoint handler
 * Returns server status and configuration info
 */
export const healthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    model: process.env.MODEL || 'gemini-2.0-flash-exp',
  };

  logger.debug('Health check requested', { ip: req.ip });

  res.status(200).json(health);
};
