/**
 * Input validation middleware
 * Validates request body for the /enhance endpoint
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { isValidPrompt } from '../utils/sanitize';
import { EnhanceRequest } from '../types/EnhanceTypes';

/**
 * Validates the enhance request body
 * Ensures originalPrompt exists and is valid
 */
export const validateEnhanceInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const body = req.body as Partial<EnhanceRequest>;

  // Check if body exists
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body is required', 400);
  }

  // Check if originalPrompt exists
  if (!body.originalPrompt) {
    throw new AppError('originalPrompt is required', 400);
  }

  // Check if originalPrompt is a string
  if (typeof body.originalPrompt !== 'string') {
    throw new AppError('originalPrompt must be a string', 400);
  }

  // Validate prompt content
  if (!isValidPrompt(body.originalPrompt)) {
    throw new AppError(
      'originalPrompt must be a non-empty string with valid content',
      400
    );
  }

  // Prompt is valid, continue
  next();
};

/**
 * Content-Type validation middleware
 * Ensures requests are JSON
 */
export const validateContentType = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.method === 'POST' && !req.is('application/json')) {
    throw new AppError('Content-Type must be application/json', 415);
  }
  next();
};
