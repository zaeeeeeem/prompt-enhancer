/**
 * Gemini AI Service
 * Handles all interactions with Google's Gemini API
 * Includes retry logic, timeout handling, and token usage tracking
 */

import dotenv from 'dotenv';
dotenv.config();

import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';
import { sanitizeInput, markdownToPlainText } from '../utils/sanitize';
import {
  GeminiRequest,
  GeminiResponse,
  GeminiConfig,
  TokenUsage,
} from '../types/EnhanceTypes';
import { AppError } from '../middleware/errorHandler';

/**
 * Prompt engineering template for enhancing user prompts
 * This is the system instruction that guides Gemini to improve prompts
 */
const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer.
Your job is to enhance the user's prompt with:
- Clarity
- Structure
- Explicit instructions
- Constraints
- Role assignment
- Examples (only if needed)
- Removal of ambiguity
- Improved overall reasoning quality

Rules:
- Preserve user intent exactly.
- Improve readability and power.
- Do NOT add irrelevant content.
- Return only the enhanced prompt, nothing else.`;

/**
 * Gemini Service Class
 * Manages API calls to Google Gemini with retry logic and error handling
 */
class GeminiService {
  private config: GeminiConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.MODEL || 'gemini-2.0-flash-exp',
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
      timeout: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10),
    };

    // Validate API key on initialization
    if (!this.config.apiKey) {
      logger.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  /**
   * Enhances a user prompt using Gemini API
   * @param originalPrompt - The user's original prompt
   * @returns Object containing enhanced prompt and usage statistics
   */
  async enhancePrompt(originalPrompt: string): Promise<{
    enhancedPrompt: string;
    usage: TokenUsage;
  }> {
    // Sanitize input
    const sanitizedPrompt = sanitizeInput(originalPrompt);

    if (!sanitizedPrompt) {
      throw new AppError('Invalid or empty prompt after sanitization', 400);
    }

    logger.info('Enhancing prompt', {
      originalLength: originalPrompt.length,
      sanitizedLength: sanitizedPrompt.length,
    });

    // Construct the full prompt with system instructions
    const fullPrompt = `${ENHANCEMENT_SYSTEM_PROMPT}\n\nUser Prompt to Enhance:\n${sanitizedPrompt}`;

    // Make API call with retry logic
    const response = await this.callGeminiWithRetry(fullPrompt);

    return response;
  }

  /**
   * Calls Gemini API with automatic retry logic
   * @param prompt - The prompt to send to Gemini
   * @returns Enhanced prompt and token usage
   */
  private async callGeminiWithRetry(prompt: string): Promise<{
    enhancedPrompt: string;
    usage: TokenUsage;
  }> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < this.config.maxRetries) {
      try {
        attempt++;
        logger.debug(`Gemini API call attempt ${attempt}/${this.config.maxRetries}`);

        const result = await this.callGeminiAPI(prompt);

        logger.info('Gemini API call successful', {
          attempt,
          tokensUsed: result.usage.totalTokens,
        });

        return result;
      } catch (error) {
        lastError = error as Error;

        logger.warn(`Gemini API call failed (attempt ${attempt})`, {
          error: (error as Error).message,
          willRetry: attempt < this.config.maxRetries,
        });

        // Don't retry on client errors (400-499)
        if (error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    logger.error('All Gemini API retry attempts failed', {
      attempts: this.config.maxRetries,
      lastError: lastError?.message,
    });

    throw new AppError(
      'Failed to enhance prompt after multiple attempts. Please try again later.',
      503
    );
  }

  /**
   * Makes a single call to the Gemini API
   * @param prompt - The prompt to send
   * @returns Enhanced prompt and token usage
   */
  private async callGeminiAPI(prompt: string): Promise<{
    enhancedPrompt: string;
    usage: TokenUsage;
  }> {
    const url = `${this.baseUrl}/${this.config.model}:generateContent`;

    // Construct request payload
    const requestPayload: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    try {
      // Make HTTP request to Gemini API
      const response = await axios.post<GeminiResponse>(
        url,
        requestPayload,
        {
          params: {
            key: this.config.apiKey,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.config.timeout,
        }
      );

      // Validate response structure
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new AppError('Invalid response structure from Gemini API', 502);
      }

      const rawResponse = response.data.candidates[0].content.parts[0].text;
      const usageMetadata = response.data.usageMetadata;

      // Convert markdown to plain text for cleaner output
      const enhancedPrompt = markdownToPlainText(rawResponse);

      // Extract token usage
      const usage: TokenUsage = {
        inputTokens: usageMetadata?.promptTokenCount || 0,
        outputTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      };

      return {
        enhancedPrompt,
        usage,
      };
    } catch (error) {
      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        return this.handleAxiosError(error);
      }

      // Re-throw if already AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Generic error
      throw new AppError('Failed to communicate with Gemini API', 500);
    }
  }

  /**
   * Handles Axios errors and converts them to AppError
   * @param error - Axios error object
   */
  private handleAxiosError(error: AxiosError): never {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new AppError('Request to Gemini API timed out', 504);
    }

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      logger.error('Gemini API error response', {
        status,
        data,
      });

      if (status === 400) {
        throw new AppError('Invalid request to Gemini API', 400);
      } else if (status === 401 || status === 403) {
        throw new AppError('Invalid or missing Gemini API key', 401);
      } else if (status === 429) {
        throw new AppError('Gemini API rate limit exceeded. Please try again later.', 429);
      } else if (status >= 500) {
        throw new AppError('Gemini API is temporarily unavailable', 503);
      }

      throw new AppError(`Gemini API error: ${data?.error?.message || 'Unknown error'}`, status);
    }

    if (error.request) {
      // Request was made but no response received
      throw new AppError('No response from Gemini API. Please check your connection.', 503);
    }

    // Something else went wrong
    throw new AppError('Failed to make request to Gemini API', 500);
  }

  /**
   * Sleep utility for retry delays
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new GeminiService();
