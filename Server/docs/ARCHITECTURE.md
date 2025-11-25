# Architecture Overview

Visual representation of the PromptEnhance Backend architecture.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Chrome     │     │   Web App    │     │  Mobile App  │    │
│  │  Extension   │     │              │     │              │    │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
│         │                    │                     │             │
│         └────────────────────┴─────────────────────┘             │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               │ HTTP/HTTPS
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                      EXPRESS.JS SERVER                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   MIDDLEWARE LAYER                           │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Helmet  │→ │   CORS   │→ │  Parser  │→ │Rate Limit│   │ │
│  │  │ Security │  │  Origin  │  │   JSON   │  │  10/min  │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │ Content  │→ │  Input   │→ │  Async   │                  │ │
│  │  │   Type   │  │Validation│  │ Handler  │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  │                                                              │ │
│  └──────────────────────────────┬───────────────────────────────┘ │
│                                 │                                 │
│  ┌──────────────────────────────▼───────────────────────────────┐ │
│  │                      ROUTING LAYER                            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  GET  /           →  API Info                                │ │
│  │  POST /enhance    →  Enhance Prompt                          │ │
│  │  GET  /health     →  Health Check                            │ │
│  │                                                               │ │
│  └──────────────────────────────┬────────────────────────────────┘ │
│                                 │                                 │
│  ┌──────────────────────────────▼───────────────────────────────┐ │
│  │                   CONTROLLER LAYER                            │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌────────────────────────────────────────────────┐          │ │
│  │  │  enhancePrompt(req, res)                       │          │ │
│  │  │  ├─ Extract originalPrompt                     │          │ │
│  │  │  ├─ Start latency timer                        │          │ │
│  │  │  ├─ Call GeminiService                         │          │ │
│  │  │  ├─ Calculate latency                          │          │ │
│  │  │  └─ Return EnhanceResponse                     │          │ │
│  │  └────────────────────────────────────────────────┘          │ │
│  │                                                               │ │
│  └──────────────────────────────┬────────────────────────────────┘ │
│                                 │                                 │
│  ┌──────────────────────────────▼───────────────────────────────┐ │
│  │                    SERVICE LAYER                              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌────────────────────────────────────────────────┐          │ │
│  │  │  GeminiService                                 │          │ │
│  │  │  ├─ sanitizeInput()                            │          │ │
│  │  │  ├─ buildPromptWithTemplate()                  │          │ │
│  │  │  ├─ callGeminiWithRetry()                      │          │ │
│  │  │  │  ├─ Attempt 1 ────────┐                     │          │ │
│  │  │  │  ├─ Attempt 2 (1s)    │ Exponential        │          │ │
│  │  │  │  └─ Attempt 3 (2s)    │ Backoff            │          │ │
│  │  │  ├─ parseResponse()                            │          │ │
│  │  │  └─ extractTokenUsage()                        │          │ │
│  │  └────────────────────────────────────────────────┘          │ │
│  │                                                               │ │
│  └──────────────────────────────┬────────────────────────────────┘ │
│                                 │                                 │
│  ┌──────────────────────────────▼───────────────────────────────┐ │
│  │                    UTILITY LAYER                              │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │ │
│  │  │  Sanitizer   │  │    Logger    │  │    Error     │       │ │
│  │  │  Remove XSS  │  │   Winston    │  │   Handler    │       │ │
│  │  │  Validate    │  │  Structured  │  │  AppError    │       │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTPS API Call
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                    GOOGLE GEMINI API                              │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  generativelanguage.googleapis.com/v1beta/models/                │
│  gemini-2.0-flash-exp:generateContent                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AI Model Processing                                         │ │
│  │  ├─ Parse enhanced prompt request                            │ │
│  │  ├─ Apply prompt engineering                                 │ │
│  │  ├─ Generate enhanced version                                │ │
│  │  ├─ Calculate token usage                                    │ │
│  │  └─ Return response                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

```
┌────────────┐
│   Client   │
│ (Extension)│
└─────┬──────┘
      │ 1. POST /enhance
      │    { originalPrompt: "..." }
      │
      ▼
┌─────────────────────────────────────────────────┐
│           Express.js Middleware                  │
├─────────────────────────────────────────────────┤
│ 2. Security Check (Helmet)                      │
│    ✓ Security headers applied                   │
├─────────────────────────────────────────────────┤
│ 3. CORS Check                                   │
│    ✓ Origin: chrome-extension://...            │
├─────────────────────────────────────────────────┤
│ 4. JSON Parser                                  │
│    ✓ Body parsed, size checked (< 5KB)         │
├─────────────────────────────────────────────────┤
│ 5. Global Rate Limiter                          │
│    ✓ 30 req/min not exceeded                    │
├─────────────────────────────────────────────────┤
│ 6. Request Logger                               │
│    ℹ️ Logged: IP, method, path, user-agent      │
├─────────────────────────────────────────────────┤
│ 7. Enhance Rate Limiter                         │
│    ✓ 10 req/min not exceeded                    │
├─────────────────────────────────────────────────┤
│ 8. Content-Type Validator                       │
│    ✓ Content-Type: application/json            │
├─────────────────────────────────────────────────┤
│ 9. Input Validator                              │
│    ✓ originalPrompt exists                      │
│    ✓ Is string                                  │
│    ✓ Non-empty                                  │
│    ✓ Valid content                              │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│         enhance.controller.ts                    │
├─────────────────────────────────────────────────┤
│ 10. Start latency timer                         │
│ 11. Extract originalPrompt from body            │
│ 12. Log request details                         │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│          gemini.service.ts                       │
├─────────────────────────────────────────────────┤
│ 13. Sanitize input                              │
│     ├─ Remove HTML tags                         │
│     ├─ Remove XSS vectors                       │
│     └─ Normalize whitespace                     │
├─────────────────────────────────────────────────┤
│ 14. Build prompt with template                  │
│     ├─ Add system instructions                  │
│     └─ Combine with user prompt                 │
├─────────────────────────────────────────────────┤
│ 15. Call Gemini API (with retry)               │
│                                                  │
│     Attempt 1 ───────────┐                      │
│     │                    │                      │
│     ▼                    │                      │
│   ┌──────────────────┐   │                      │
│   │  Gemini API Call │   │ If fails            │
│   └────────┬─────────┘   │ (5xx/timeout)       │
│            │              │                      │
│     Success?             │                      │
│     │  No                │                      │
│     │◄─────────────────┘                      │
│     │                                           │
│     │ Wait 1s (exponential backoff)           │
│     ▼                                           │
│   Attempt 2 ───────────┐                       │
│     │                   │                       │
│     ▼                   │ If fails              │
│   ┌──────────────────┐  │                       │
│   │  Gemini API Call │  │                       │
│   └────────┬─────────┘  │                       │
│            │             │                       │
│     Success?            │                       │
│     │  No               │                       │
│     │◄────────────────┘                       │
│     │                                           │
│     │ Wait 2s                                  │
│     ▼                                           │
│   Attempt 3 (final)                            │
│     │                                           │
│     ▼                                           │
│   ┌──────────────────┐                          │
│   │  Gemini API Call │                          │
│   └────────┬─────────┘                          │
│            │                                     │
│     Success? ───► YES ────────────────┐         │
│     │                                  │         │
│     NO                                 │         │
│     │                                  │         │
│     ▼                                  ▼         │
│  ❌ Throw Error               ✅ Continue        │
│                                                  │
├─────────────────────────────────────────────────┤
│ 16. Parse Gemini response                       │
│     ├─ Extract enhanced prompt text             │
│     ├─ Extract token counts                     │
│     │  ├─ inputTokens                           │
│     │  ├─ outputTokens                          │
│     │  └─ totalTokens                           │
│     └─ Validate response structure              │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│         enhance.controller.ts                    │
├─────────────────────────────────────────────────┤
│ 17. Calculate latency                           │
│     latencyMs = Date.now() - startTime          │
├─────────────────────────────────────────────────┤
│ 18. Format response                             │
│     {                                            │
│       enhancedPrompt: "...",                    │
│       usage: { ... },                           │
│       latencyMs: 1234                           │
│     }                                            │
├─────────────────────────────────────────────────┤
│ 19. Log success                                 │
│     ℹ️ Token usage, latency, lengths            │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│            Response to Client                    │
├─────────────────────────────────────────────────┤
│ 20. HTTP 200 OK                                 │
│     Content-Type: application/json              │
│     {                                            │
│       "enhancedPrompt": "...",                  │
│       "usage": {                                │
│         "inputTokens": 67,                      │
│         "outputTokens": 342,                    │
│         "totalTokens": 409                      │
│       },                                         │
│       "latencyMs": 1842                         │
│     }                                            │
└─────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────┐
│         Error Occurs Anywhere                    │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│    Thrown Error or next(error)                   │
└─────┬───────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────┐
│        errorHandler Middleware                   │
├─────────────────────────────────────────────────┤
│ 1. Identify error type                          │
│    ├─ AppError (custom)                         │
│    ├─ ValidationError                           │
│    ├─ UnauthorizedError                         │
│    └─ Generic Error                             │
├─────────────────────────────────────────────────┤
│ 2. Determine HTTP status code                   │
│    ├─ AppError → statusCode property            │
│    ├─ ValidationError → 400                     │
│    ├─ UnauthorizedError → 401                   │
│    └─ Other → 500                               │
├─────────────────────────────────────────────────┤
│ 3. Log error with context                       │
│    ├─ Error message                             │
│    ├─ Stack trace (dev only)                    │
│    ├─ Status code                               │
│    ├─ Request path                              │
│    ├─ Request method                            │
│    └─ Client IP                                 │
├─────────────────────────────────────────────────┤
│ 4. Format error response                        │
│    Production mode:                             │
│    {                                             │
│      "error": true,                             │
│      "message": "Sanitized message"             │
│    }                                             │
│                                                  │
│    Development mode:                            │
│    {                                             │
│      "error": true,                             │
│      "message": "Full error message"            │
│    }                                             │
├─────────────────────────────────────────────────┤
│ 5. Send error response                          │
│    res.status(statusCode).json(errorResponse)   │
└─────────────────────────────────────────────────┘
```

---

## Data Models

### EnhanceRequest
```typescript
{
  originalPrompt: string  // User's input prompt
}
```

### EnhanceResponse (Success)
```typescript
{
  enhancedPrompt: string,     // AI-enhanced prompt
  usage: {
    inputTokens: number,      // Tokens in input
    outputTokens: number,     // Tokens generated
    totalTokens: number       // Total used
  },
  latencyMs: number           // Processing time
}
```

### ErrorResponse
```typescript
{
  error: true,
  message: string             // Human-readable error
}
```

### GeminiRequest (to API)
```typescript
{
  contents: [
    {
      parts: [
        {
          text: string        // Full prompt with template
        }
      ]
    }
  ]
}
```

### GeminiResponse (from API)
```typescript
{
  candidates: [
    {
      content: {
        parts: [
          { text: string }    // Enhanced prompt
        ]
      },
      finishReason: string
    }
  ],
  usageMetadata: {
    promptTokenCount: number,
    candidatesTokenCount: number,
    totalTokenCount: number
  }
}
```

---

## Security Layers

```
┌─────────────────────────────────────────────────┐
│              Security Stack                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: Network Security                      │
│  ├─ CORS (Chrome extension origins only)        │
│  ├─ Helmet (Security headers)                   │
│  └─ HTTPS (recommended for production)          │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 2: Rate Limiting                         │
│  ├─ Global: 30 req/min per IP                   │
│  └─ Endpoint: 10 req/min per IP                 │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 3: Input Validation                      │
│  ├─ Content-Type check                          │
│  ├─ Body size limit (5KB)                       │
│  ├─ Required field validation                   │
│  └─ Type checking                               │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 4: Input Sanitization                    │
│  ├─ HTML tag removal                            │
│  ├─ XSS vector stripping                        │
│  ├─ Script removal                              │
│  └─ Whitespace normalization                    │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 5: API Security                          │
│  ├─ API key from environment                    │
│  ├─ Request timeout (30s)                       │
│  └─ Error message sanitization                  │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  Layer 6: Error Handling                        │
│  ├─ No stack traces in production               │
│  ├─ Sanitized error messages                    │
│  └─ Comprehensive logging                       │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Component Dependencies

```
┌─────────────────────────────────────────────────┐
│                  server.ts                       │
│  (Entry point, lifecycle management)            │
└─────┬───────────────────────────────────────────┘
      │ imports
      ▼
┌─────────────────────────────────────────────────┐
│                   app.ts                         │
│  (Express configuration)                        │
└─────┬───────────────────────────────────────────┘
      │ imports
      ├──────────┬──────────┬──────────┬──────────┤
      ▼          ▼          ▼          ▼          ▼
  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
  │ Routes │ │Middleware│ │ Utils │ │ Types │ │Services│
  └────┬───┘ └────┬───┘ └────┬───┘ └────────┘ └────┬───┘
       │          │          │                      │
       │          │          │                      │
       ▼          ▼          ▼                      ▼
  ┌────────────────────────────────────────────────────┐
  │           enhance.route.ts                          │
  │  ├─ Imports: middleware, controllers               │
  │  └─ Defines: POST /enhance, GET /health            │
  └────┬───────────────────────────────────────────────┘
       │ uses
       ▼
  ┌────────────────────────────────────────────────────┐
  │         enhance.controller.ts                       │
  │  ├─ Imports: services, utils, types                │
  │  └─ Handlers: enhancePrompt, healthCheck           │
  └────┬───────────────────────────────────────────────┘
       │ calls
       ▼
  ┌────────────────────────────────────────────────────┐
  │          gemini.service.ts                          │
  │  ├─ Imports: axios, utils, types                   │
  │  └─ Methods: enhancePrompt, callGeminiAPI          │
  └────────────────────────────────────────────────────┘
```

---

## File Responsibility Matrix

| Component | Responsibilities | Dependencies |
|-----------|-----------------|--------------|
| **server.ts** | • Start server<br>• Validate env vars<br>• Graceful shutdown<br>• Exception handling | app.ts, logger |
| **app.ts** | • Configure Express<br>• Setup middleware<br>• Mount routes<br>• Error handlers | routes, middleware, logger |
| **enhance.route.ts** | • Define endpoints<br>• Apply middleware<br>• Route to controllers | controllers, middleware |
| **enhance.controller.ts** | • Handle requests<br>• Call services<br>• Format responses<br>• Measure latency | services, logger, types |
| **gemini.service.ts** | • Gemini API integration<br>• Retry logic<br>• Token tracking<br>• Error handling | axios, utils, types |
| **errorHandler.ts** | • Catch errors<br>• Format error responses<br>• Log errors | logger, types |
| **validateInput.ts** | • Validate request body<br>• Check required fields<br>• Type validation | sanitize, types |
| **rateLimit.ts** | • Rate limiting config<br>• Custom handlers | express-rate-limit, types |
| **sanitize.ts** | • Input sanitization<br>• XSS prevention<br>• Validation | None |
| **logger.ts** | • Logging configuration<br>• File/console output | winston |
| **EnhanceTypes.ts** | • Type definitions<br>• Interfaces | None |

---

## Technology Stack Details

```
┌─────────────────────────────────────────────────┐
│              Runtime & Framework                 │
├─────────────────────────────────────────────────┤
│ • Node.js 18+        Runtime environment        │
│ • Express.js 4.x     Web framework              │
│ • TypeScript 5.x     Type safety                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  Security                        │
├─────────────────────────────────────────────────┤
│ • Helmet 7.x         Security headers           │
│ • CORS 2.x           Origin control             │
│ • express-rate-limit Rate limiting              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              External Services                   │
├─────────────────────────────────────────────────┤
│ • Google Gemini API  AI model                   │
│ • Axios 1.x          HTTP client                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            Observability                         │
├─────────────────────────────────────────────────┤
│ • Winston 3.x        Structured logging         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│           Development Tools                      │
├─────────────────────────────────────────────────┤
│ • ts-node-dev        Hot reload                 │
│ • ESLint             Code linting               │
│ • dotenv             Environment config         │
└─────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Server 1   │     │   Server 2   │     │   Server 3   │
│   Port 3000  │     │   Port 3001  │     │   Port 3002  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Load Balancer │
                    │     (nginx)    │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │    Clients     │
                    └────────────────┘
```

### Caching Layer (Future)
```
Client → Cache (Redis) → Server → Gemini API
         ↑ Hit: Return cached
         ↓ Miss: Fetch & cache
```

### Database Integration (Future)
```
Server → Database (MongoDB/PostgreSQL)
         ├─ Store request logs
         ├─ Track usage metrics
         └─ Cache popular prompts
```

---

## Performance Metrics

```
┌─────────────────────────────────────────────────┐
│            Performance Targets                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Latency (End-to-End)                           │
│  ├─ Target: < 2 seconds                         │
│  ├─ Typical: 1-3 seconds                        │
│  └─ Max: 30 seconds (timeout)                   │
│                                                  │
│  Throughput                                      │
│  ├─ Max: 10 requests/min per IP                 │
│  └─ Gemini API limit: 10 RPM (free tier)        │
│                                                  │
│  Memory Usage                                    │
│  ├─ Base: ~50-100 MB                            │
│  └─ Per request: ~1-5 MB                        │
│                                                  │
│  CPU Usage                                       │
│  ├─ Idle: < 5%                                  │
│  └─ Under load: 10-30%                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

This architecture provides a solid, scalable foundation for the PromptEnhancer backend with clear separation of concerns and comprehensive error handling.