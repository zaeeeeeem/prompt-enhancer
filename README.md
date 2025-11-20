# PromptEnhance Backend

Production-ready backend server for the **PromptEnhancer Chrome Extension**. This server receives user prompts, enhances them using Google's Gemini AI API, and returns improved versions with better clarity, structure, and reasoning quality.

## Features

- **AI-Powered Prompt Enhancement**: Uses Google Gemini 2.0 Flash model for intelligent prompt improvement
- **Production Ready**: Full TypeScript implementation with comprehensive error handling
- **Security First**: Helmet security headers, CORS protection, input sanitization, and rate limiting
- **Retry Logic**: Automatic retry with exponential backoff for failed API calls
- **Token Tracking**: Detailed usage statistics for every request
- **Latency Monitoring**: Real-time performance metrics
- **Comprehensive Logging**: Winston-based structured logging
- **Scalable Architecture**: Clean separation of concerns with services, controllers, and middleware

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **AI API**: Google Gemini 2.0 Flash
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston
- **HTTP Client**: Axios

## Project Structure

```
Server/
├── src/
│   ├── app.ts                      # Express app configuration
│   ├── server.ts                   # Server entry point
│   ├── types/
│   │   └── EnhanceTypes.ts         # TypeScript type definitions
│   ├── routes/
│   │   └── enhance.route.ts        # API route definitions
│   ├── controllers/
│   │   └── enhance.controller.ts   # Request handlers
│   ├── services/
│   │   └── gemini.service.ts       # Gemini API integration
│   ├── middleware/
│   │   ├── errorHandler.ts         # Global error handling
│   │   ├── validateInput.ts        # Input validation
│   │   └── rateLimit.ts            # Rate limiting
│   └── utils/
│       ├── sanitize.ts             # Input sanitization
│       └── logger.ts               # Logging utility
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Installation

### Prerequisites

- Node.js 18+ and npm 9+
- Google Gemini API key (free from [AI Studio](https://ai.google.dev/))

### Setup Steps

1. **Clone or navigate to the Server directory**:
   ```bash
   cd Server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Google Gemini API Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   MODEL=gemini-2.0-flash-exp

   # CORS Configuration
   ALLOWED_ORIGIN=chrome-extension://your-extension-id-here

   # Rate Limiting (requests per minute per IP)
   RATE_LIMIT_MAX=10

   # Request Configuration
   MAX_BODY_SIZE=5kb
   REQUEST_TIMEOUT_MS=30000

   # Retry Configuration
   MAX_RETRIES=3
   RETRY_DELAY_MS=1000
   ```

5. **Get your Gemini API key**:
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Sign in with your Google account
   - Click "Get API Key"
   - Copy the key and paste it into `.env`

6. **Get your Chrome Extension ID**:
   - Load your extension in Chrome (chrome://extensions)
   - Enable "Developer mode"
   - Copy the extension ID (format: `abcdefghijklmnopqrstuvwxyz123456`)
   - Update `ALLOWED_ORIGIN` in `.env` to `chrome-extension://YOUR_EXTENSION_ID`

## Running the Server

### Development Mode
With hot reload using ts-node-dev:
```bash
npm run dev
```

### Production Mode
Build and run optimized JavaScript:
```bash
npm run prod
```

Or build and run separately:
```bash
npm run build
npm start
```

### Expected Output
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   PromptEnhance Backend Server                    ║
║                                                   ║
║   Status: Running                                 ║
║   Port: 3000                                      ║
║   Environment: development                        ║
║   Model: gemini-2.0-flash-exp                     ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /           - API info                   ║
║   • POST /enhance    - Enhance prompts            ║
║   • GET  /health     - Health check               ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Root Endpoint
**GET /** - API information

**Response** (200 OK):
```json
{
  "name": "PromptEnhance Backend",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "enhance": "POST /enhance",
    "health": "GET /health"
  }
}
```

#### 2. Enhance Prompt
**POST /enhance** - Enhance a user prompt using Gemini AI

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "originalPrompt": "string"
}
```

**Success Response** (200 OK):
```json
{
  "enhancedPrompt": "string",
  "usage": {
    "inputTokens": 123,
    "outputTokens": 456,
    "totalTokens": 579
  },
  "latencyMs": 1234
}
```

**Error Response** (4xx/5xx):
```json
{
  "error": true,
  "message": "Error description"
}
```

**Rate Limiting**: 10 requests per minute per IP

#### 3. Health Check
**GET /health** - Server health status

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "uptime": 3600.5,
  "environment": "development",
  "model": "gemini-2.0-flash-exp"
}
```

### Example Requests

#### Using fetch (JavaScript):
```javascript
// From Chrome Extension content script or background script
fetch("http://localhost:3000/enhance", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    originalPrompt: "make a website for me"
  })
})
  .then(response => response.json())
  .then(data => {
    console.log("Enhanced:", data.enhancedPrompt);
    console.log("Tokens used:", data.usage.totalTokens);
    console.log("Latency:", data.latencyMs + "ms");
  })
  .catch(error => {
    console.error("Error:", error);
  });
```

#### Using curl:
```bash
curl -X POST http://localhost:3000/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrompt": "make a website for me"
  }'
```

#### Using Axios:
```javascript
import axios from 'axios';

const response = await axios.post('http://localhost:3000/enhance', {
  originalPrompt: 'make a website for me'
});

console.log(response.data);
```

## Chrome Extension Integration

### How the Extension Communicates with the Backend

The Chrome extension communicates with this backend server using standard HTTP requests. Here's how to integrate:

#### 1. Extension Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "PromptEnhancer",
  "version": "1.0.0",
  "permissions": [
    "storage"
  ],
  "host_permissions": [
    "http://localhost:3000/*"
  ]
}
```

#### 2. Background Script (background.js)
```javascript
// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    // Call backend API
    fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalPrompt: request.prompt
      })
    })
      .then(response => response.json())
      .then(data => {
        sendResponse({
          success: true,
          enhancedPrompt: data.enhancedPrompt,
          usage: data.usage
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true; // Keep channel open for async response
  }
});
```

#### 3. Content Script (content.js)
```javascript
// Send message to background script
function enhancePrompt(prompt) {
  chrome.runtime.sendMessage(
    {
      action: 'enhancePrompt',
      prompt: prompt
    },
    (response) => {
      if (response.success) {
        console.log('Enhanced:', response.enhancedPrompt);
        // Use the enhanced prompt
      } else {
        console.error('Error:', response.error);
      }
    }
  );
}

// Example: Enhance text from a textarea
const textarea = document.querySelector('textarea');
if (textarea) {
  enhancePrompt(textarea.value);
}
```

### Message Flow

```
User Input (Webpage)
       ↓
Content Script (detects input)
       ↓
Background Script (receives message)
       ↓
Backend Server (POST /enhance)
       ↓
Google Gemini API (AI processing)
       ↓
Backend Server (receives response)
       ↓
Background Script (receives response)
       ↓
Content Script (receives enhanced prompt)
       ↓
User Interface (displays enhanced text)
```

## Security Features

### 1. CORS Protection
- Only allows requests from Chrome extensions (`chrome-extension://`)
- Configurable allowed origin via environment variables
- Development mode supports localhost for testing

### 2. Rate Limiting
- Global rate limit: 30 requests/minute per IP
- Enhance endpoint: 10 requests/minute per IP (matches Gemini free tier)
- Automatic 429 responses when limits exceeded

### 3. Input Sanitization
- Removes HTML tags and scripts
- Strips XSS vectors
- Validates prompt length and content
- Normalizes whitespace

### 4. Security Headers
- Helmet.js for standard security headers
- Protection against common vulnerabilities

### 5. Request Size Limits
- Maximum body size: 5KB
- Prevents memory exhaustion attacks

## Error Handling

### Error Response Format
All errors follow this structure:
```json
{
  "error": true,
  "message": "Human-readable error description"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Missing or invalid `originalPrompt` |
| 401 | Unauthorized | Invalid Gemini API key |
| 415 | Unsupported Media Type | Wrong Content-Type header |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 502 | Bad Gateway | Invalid Gemini API response |
| 503 | Service Unavailable | Gemini API down or unreachable |
| 504 | Gateway Timeout | Gemini API request timeout |

## Logging

The server uses Winston for structured logging:

- **Development**: Console output with colors
- **Production**: Console + file logging
  - `logs/error.log` - Error logs only
  - `logs/combined.log` - All logs

### Log Levels
- `error` - Error messages
- `warn` - Warnings
- `info` - Informational messages
- `debug` - Debug information (dev only)

### Example Log Entry
```json
{
  "timestamp": "2025-01-20 12:00:00",
  "level": "info",
  "message": "Prompt enhanced successfully",
  "originalLength": 20,
  "enhancedLength": 150,
  "tokensUsed": 45,
  "latencyMs": 1234
}
```

## Performance

### Retry Strategy
- **Max retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **Timeout**: 30 seconds per request
- **No retry on**: Client errors (4xx)

### Latency Tracking
Every response includes `latencyMs` field showing total processing time including:
- Input validation
- Sanitization
- Gemini API call
- Response formatting

## Gemini API Configuration

### Models Supported
- `gemini-2.0-flash-exp` (default, best performance)
- `gemini-1.5-flash`
- `gemini-1.5-flash-8b`

### API Limits (Free Tier)
- **Requests**: 10 RPM (requests per minute)
- **Tokens**: 4 million per day
- **Max prompt size**: ~30,000 characters

### Prompt Engineering
The backend uses an expert system prompt to enhance user prompts:

```
You are an expert prompt engineer.
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
- Return only the enhanced prompt, nothing else.
```

## Troubleshooting

### "GEMINI_API_KEY is not configured"
- Ensure `.env` file exists in the Server directory
- Verify `GEMINI_API_KEY` is set correctly
- Restart the server after changing `.env`

### "Not allowed by CORS"
- Update `ALLOWED_ORIGIN` in `.env` with your extension ID
- Format: `chrome-extension://YOUR_EXTENSION_ID`
- Get extension ID from `chrome://extensions`

### "Too many requests"
- You've exceeded rate limits (10 req/min)
- Wait 1 minute before trying again
- Consider upgrading Gemini API tier for higher limits

### "Gemini API error: 401"
- Your API key is invalid or expired
- Generate a new key from [AI Studio](https://ai.google.dev/)
- Update `.env` with the new key

### Server won't start
- Check if port 3000 is already in use
- Change `PORT` in `.env` to a different port
- Ensure all dependencies are installed: `npm install`

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production code
- `npm run prod` - Build and run production server
- `npm run lint` - Lint TypeScript code

### Environment Variables
See `.env.example` for all available configuration options.

### TypeScript Configuration
The project uses strict TypeScript settings for type safety:
- Strict null checks
- No implicit any
- Strict function types
- No unused locals/parameters

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a secure `GEMINI_API_KEY`
3. Set proper `ALLOWED_ORIGIN` for your deployed extension
4. Consider using environment-specific configs

### Recommendations
- Use a process manager (PM2, systemd)
- Set up log rotation
- Monitor server health
- Use HTTPS in production
- Implement request authentication if needed
- Consider caching frequently enhanced prompts

### PM2 Example
```bash
npm install -g pm2
pm2 start dist/server.js --name promptenhance-backend
pm2 save
pm2 startup
```

## License

MIT

## Support

For issues, questions, or contributions:
- Check the troubleshooting section above
- Review the Gemini API documentation: https://ai.google.dev/
- Ensure all environment variables are correctly configured

---

**Built with TypeScript, Express, and Google Gemini AI**
