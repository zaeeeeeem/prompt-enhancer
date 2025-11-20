/**
 * Input sanitization utilities
 * Removes potentially malicious content from user inputs
 */

/**
 * Sanitizes input text by removing HTML tags, script content, and potentially malicious characters
 * @param input - The raw input string to sanitize
 * @returns Sanitized string safe for processing
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove potential XSS vectors
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize whitespace (but preserve intentional line breaks)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validates that the prompt meets basic requirements
 * @param prompt - The prompt to validate
 * @returns True if valid, false otherwise
 */
export function isValidPrompt(prompt: string): boolean {
  if (!prompt || typeof prompt !== 'string') {
    return false;
  }

  const trimmed = prompt.trim();

  // Must be non-empty after trimming
  if (trimmed.length === 0) {
    return false;
  }

  // Must not exceed reasonable length (100KB)
  if (trimmed.length > 100000) {
    return false;
  }

  // Must contain at least some alphanumeric characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Escapes special characters to prevent injection attacks
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeSpecialChars(str: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Converts markdown-formatted text to clean plain text
 * Removes markdown syntax while preserving readability
 * @param text - The markdown text to convert
 * @returns Plain text without markdown formatting
 */
export function markdownToPlainText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    // Remove bold (**text**)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove italics (*text*)
    .replace(/\*(.*?)\*/g, '$1')
    // Remove inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove headers (# Header)
    .replace(/^#+\s+/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove markdown-style list indentation
    .replace(/^\s*-\s*/gm, '- ')
    .replace(/^\s*\*\s*/gm, '- ')
    .replace(/^\s*\d+\.\s*/gm, '')
    // Remove horizontal rules (---, ***)
    .replace(/^[\-\*]{3,}$/gm, '')
    // Remove blockquotes (> text)
    .replace(/^>\s*/gm, '')
    // Normalize multiple newlines (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Normalize multiple spaces
    .replace(/[ \t]{2,}/g, ' ')
    // Trim whitespace
    .trim();
}
