/**
 * Type definitions for the PromptEnhancer backend
 */

/**
 * Request payload structure for the /enhance endpoint
 */
export interface EnhanceRequest {
  originalPrompt: string;
}

/**
 * Token usage statistics from Gemini API
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Success response structure for the /enhance endpoint
 */
export interface EnhanceResponse {
  enhancedPrompt: string;
  usage: TokenUsage;
  latencyMs: number;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: boolean;
  message: string;
}

/**
 * Gemini API request structure
 */
export interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
}

/**
 * Gemini API response structure
 */
export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Configuration for Gemini API calls
 */
export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Environment variables structure
 */
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  GEMINI_API_KEY: string;
  MODEL: string;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_MAX: number;
  MAX_BODY_SIZE: string;
  REQUEST_TIMEOUT_MS: number;
  MAX_RETRIES: number;
  RETRY_DELAY_MS: number;
}
