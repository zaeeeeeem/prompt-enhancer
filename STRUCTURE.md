# Project Structure

Complete folder structure and file descriptions for the PromptEnhance Backend.

---

## Directory Tree

```
Server/
├── src/                              # Source code directory
│   ├── types/                        # TypeScript type definitions
│   │   └── EnhanceTypes.ts           # Request/response types, interfaces
│   │
│   ├── utils/                        # Utility functions
│   │   ├── sanitize.ts               # Input sanitization and validation
│   │   └── logger.ts                 # Winston logging configuration
│   │
│   ├── middleware/                   # Express middleware
│   │   ├── errorHandler.ts           # Global error handling and AppError class
│   │   ├── validateInput.ts          # Request validation middleware
│   │   └── rateLimit.ts              # Rate limiting configuration
│   │
│   ├── services/                     # Business logic layer
│   │   └── gemini.service.ts         # Gemini API integration with retry logic
│   │
│   ├── controllers/                  # Request handlers
│   │   └── enhance.controller.ts     # Enhance and health check handlers
│   │
│   ├── routes/                       # Route definitions
│   │   └── enhance.route.ts          # API endpoint routes
│   │
│   ├── app.ts                        # Express application setup
│   └── server.ts                     # Server entry point
│
├── dist/                             # Compiled JavaScript (generated)
│   └── ...                           # Built files after 'npm run build'
│
├── logs/                             # Log files (generated in production)
│   ├── error.log                     # Error logs only
│   └── combined.log                  # All logs
│
├── node_modules/                     # Dependencies (generated)
│
├── package.json                      # Project metadata and dependencies
├── package-lock.json                 # Locked dependency versions
├── tsconfig.json                     # TypeScript compiler configuration
├── .env                              # Environment variables (create from .env.example)
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── .eslintrc.json                    # ESLint configuration
├── README.md                         # Main documentation
├── API.md                            # API reference documentation
├── EXAMPLES.md                       # Usage examples
└── STRUCTURE.md                      # This file
```

---

## File Descriptions

### Root Configuration Files

#### package.json
- Project metadata, dependencies, and npm scripts
- Key dependencies: express, helmet, cors, axios, winston
- Dev dependencies: TypeScript, ts-node-dev, ESLint
- Scripts: dev, build, start, prod, lint

#### tsconfig.json
- TypeScript compiler configuration
- Strict mode enabled for type safety
- Compiles `src/` to `dist/`
- Target: ES2022, Module: CommonJS

#### .env.example
- Template for environment variables
- Contains all required and optional configuration
- Copy to `.env` and fill in values

#### .gitignore
- Excludes node_modules, dist, logs, .env from Git
- Prevents sensitive data from being committed

#### .eslintrc.json
- ESLint configuration for code quality
- TypeScript-specific rules
- Extends recommended rulesets

---

### Source Code (`src/`)

#### src/server.ts
**Purpose**: Server entry point and lifecycle management

**Key Features**:
- Validates required environment variables on startup
- Creates HTTP server with Express app
- Handles graceful shutdown (SIGTERM, SIGINT)
- Catches uncaught exceptions and unhandled rejections
- Displays startup banner with configuration info

**Exports**: HTTP server instance

---

#### src/app.ts
**Purpose**: Express application configuration

**Key Features**:
- Configures all middleware in correct order
- Sets up Helmet security headers
- Configures CORS for Chrome extensions only
- JSON body parser with 5KB limit
- Global rate limiter (30 req/min)
- Request logging
- Mounts API routes
- 404 and error handlers

**Exports**: `createApp()` function that returns configured Express app

---

### Types (`src/types/`)

#### src/types/EnhanceTypes.ts
**Purpose**: TypeScript type definitions for the entire application

**Exports**:
- `EnhanceRequest` - Request body structure
- `EnhanceResponse` - Success response structure
- `ErrorResponse` - Error response structure
- `TokenUsage` - Token usage statistics
- `GeminiRequest` - Gemini API request format
- `GeminiResponse` - Gemini API response format
- `GeminiConfig` - Service configuration
- `EnvConfig` - Environment variables type

---

### Utilities (`src/utils/`)

#### src/utils/sanitize.ts
**Purpose**: Input sanitization and validation

**Exports**:
- `sanitizeInput(input: string): string`
  - Removes HTML tags and scripts
  - Removes XSS vectors
  - Normalizes whitespace
  - Returns clean string

- `isValidPrompt(prompt: string): boolean`
  - Validates prompt is non-empty
  - Checks length limits
  - Ensures alphanumeric content

- `escapeSpecialChars(str: string): string`
  - Escapes HTML special characters
  - Prevents injection attacks

---

#### src/utils/logger.ts
**Purpose**: Structured logging using Winston

**Exports**: Winston logger instance

**Features**:
- JSON format in production
- Colored console output in development
- File logging in production (logs/ directory)
- Error and combined log files
- Automatic log rotation (5MB max, 5 files)
- Exception and rejection handlers

**Log Levels**: error, warn, info, debug

---

### Middleware (`src/middleware/`)

#### src/middleware/errorHandler.ts
**Purpose**: Centralized error handling

**Exports**:
- `AppError` class - Custom error with status code
- `errorHandler` - Express error middleware
- `notFoundHandler` - 404 handler
- `asyncHandler` - Wraps async route handlers

**Features**:
- Standardized error responses
- Environment-aware error messages
- Automatic error logging
- Proper HTTP status codes

---

#### src/middleware/validateInput.ts
**Purpose**: Request validation

**Exports**:
- `validateEnhanceInput` - Validates /enhance request body
- `validateContentType` - Ensures JSON Content-Type

**Validations**:
- Request body exists and is an object
- `originalPrompt` exists and is a string
- Prompt passes `isValidPrompt()` checks
- Content-Type is application/json

---

#### src/middleware/rateLimit.ts
**Purpose**: Rate limiting to prevent abuse

**Exports**:
- `enhanceRateLimiter` - 10 req/min for /enhance
- `globalRateLimiter` - 30 req/min for all endpoints

**Features**:
- Per-IP rate limiting
- Standard RateLimit headers
- Custom 429 error responses
- Configurable via environment variables

---

### Services (`src/services/`)

#### src/services/gemini.service.ts
**Purpose**: Google Gemini API integration

**Class**: `GeminiService` (singleton)

**Key Methods**:
- `enhancePrompt(originalPrompt: string)`
  - Main public method for prompt enhancement
  - Returns enhanced prompt and token usage

- `callGeminiWithRetry(prompt: string)`
  - Private method with retry logic
  - Exponential backoff: 1s, 2s, 4s
  - Max 3 attempts

- `callGeminiAPI(prompt: string)`
  - Makes single API call to Gemini
  - Handles request/response formatting
  - Extracts token usage

- `handleAxiosError(error: AxiosError)`
  - Converts Axios errors to AppError
  - Provides user-friendly error messages

**Features**:
- Input sanitization
- Prompt engineering template
- Automatic retries with backoff
- Timeout handling (30s default)
- Detailed error messages
- Token usage tracking

**Configuration** (from .env):
- GEMINI_API_KEY
- MODEL
- MAX_RETRIES
- RETRY_DELAY_MS
- REQUEST_TIMEOUT_MS

---

### Controllers (`src/controllers/`)

#### src/controllers/enhance.controller.ts
**Purpose**: Request handlers for API endpoints

**Exports**:
- `enhancePrompt(req, res)`
  - Handles POST /enhance
  - Extracts originalPrompt from body
  - Calls GeminiService
  - Measures latency
  - Returns EnhanceResponse

- `healthCheck(req, res)`
  - Handles GET /health
  - Returns server status and config

**Features**:
- Comprehensive logging
- Latency measurement
- Error propagation to error handler
- User agent and IP logging

---

### Routes (`src/routes/`)

#### src/routes/enhance.route.ts
**Purpose**: API route definitions

**Exports**: Express Router

**Routes**:
1. `POST /enhance`
   - Middleware: rate limiter, content-type validator, input validator
   - Handler: enhancePrompt (wrapped in asyncHandler)

2. `GET /health`
   - Handler: healthCheck (wrapped in asyncHandler)

**Features**:
- Middleware chaining
- Async error handling
- Clear route documentation

---

## Documentation Files

### README.md
- Complete setup instructions
- Installation steps
- Environment configuration
- API documentation
- Chrome extension integration guide
- Security features
- Error handling
- Troubleshooting
- Production deployment

### API.md
- Detailed API reference
- All endpoint specifications
- Request/response formats
- HTTP status codes
- Example requests (curl, fetch, axios, Python)
- Chrome extension examples
- Best practices

### EXAMPLES.md
- Real-world usage examples
- Complete Chrome extension code
- Error handling patterns
- Rate limiting strategies
- Advanced implementations:
  - Batch processing queue
  - Caching layer
  - Unit tests
- Use case scenarios

### STRUCTURE.md (This File)
- Complete folder structure
- File descriptions
- Responsibility breakdown
- Quick reference guide

---

## Data Flow

### Typical Request Flow

```
1. Client Request
   ↓
2. Express Middleware Chain
   ├─ Trust Proxy
   ├─ Helmet (Security)
   ├─ CORS (Origin Check)
   ├─ Body Parser (JSON, 5KB limit)
   ├─ Global Rate Limiter (30 req/min)
   ├─ Request Logger
   ↓
3. Route Handler
   ├─ Enhance Rate Limiter (10 req/min)
   ├─ Content-Type Validator
   ├─ Input Validator
   ↓
4. Controller
   ├─ Extract request data
   ├─ Start latency timer
   ↓
5. Service Layer
   ├─ Sanitize input
   ├─ Construct prompt
   ├─ Call Gemini API (with retries)
   ├─ Parse response
   ├─ Extract token usage
   ↓
6. Controller
   ├─ Calculate latency
   ├─ Format response
   ├─ Log success
   ↓
7. Response
   └─ JSON response to client
```

### Error Flow

```
Error occurs anywhere
   ↓
Thrown or passed to next(error)
   ↓
Error Handler Middleware
   ├─ Log error with context
   ├─ Determine status code
   ├─ Format error response
   ↓
JSON error response to client
```

---

## Key Design Patterns

### 1. Dependency Injection
- Services are singletons
- Controllers import services
- Easy to mock for testing

### 2. Middleware Chain
- Each middleware has single responsibility
- Composable and reusable
- Clear execution order

### 3. Error Handling
- Custom AppError class
- Centralized error handler
- Consistent error responses

### 4. Separation of Concerns
- Routes define endpoints
- Controllers handle requests
- Services contain business logic
- Middleware handles cross-cutting concerns

### 5. Configuration Management
- Environment variables via .env
- Type-safe config access
- Validation on startup

---

## Adding New Features

### To add a new endpoint:

1. **Define types** in `src/types/EnhanceTypes.ts`
2. **Create service** in `src/services/` (if needed)
3. **Create controller** in `src/controllers/`
4. **Add route** in `src/routes/` or create new route file
5. **Add middleware** if needed
6. **Mount route** in `src/app.ts`
7. **Update documentation** in README.md and API.md

### Example: Adding a /translate endpoint

```typescript
// 1. src/types/EnhanceTypes.ts
export interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

// 2. src/services/translate.service.ts
class TranslateService { ... }

// 3. src/controllers/translate.controller.ts
export const translateText = async (req, res) => { ... }

// 4. src/routes/translate.route.ts
router.post('/translate', validateTranslateInput, asyncHandler(translateText));

// 5. src/app.ts
import translateRoutes from './routes/translate.route';
app.use('/', translateRoutes);
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment (development/production) |
| `GEMINI_API_KEY` | **Yes** | - | Google Gemini API key |
| `MODEL` | No | gemini-2.0-flash-exp | Gemini model to use |
| `ALLOWED_ORIGIN` | No | chrome-extension://* | CORS allowed origin |
| `RATE_LIMIT_MAX` | No | 10 | Max requests per minute for /enhance |
| `MAX_BODY_SIZE` | No | 5kb | Maximum request body size |
| `REQUEST_TIMEOUT_MS` | No | 30000 | API request timeout (ms) |
| `MAX_RETRIES` | No | 3 | Max retry attempts |
| `RETRY_DELAY_MS` | No | 1000 | Initial retry delay (ms) |

---

## npm Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `ts-node-dev --respawn --transpile-only src/server.ts` | Development with hot reload |
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `start` | `node dist/server.js` | Run compiled production code |
| `prod` | `npm run build && npm run start` | Build and start production |
| `lint` | `eslint src/**/*.ts` | Lint TypeScript code |

---

## Quick Reference

### Starting the server:
```bash
# Development
npm run dev

# Production
npm run prod
```

### Making a test request:
```bash
curl -X POST http://localhost:3000/enhance \
  -H "Content-Type: application/json" \
  -d '{"originalPrompt": "test"}'
```

### Checking logs:
```bash
# Development: Check console output

# Production: Check log files
tail -f logs/combined.log
tail -f logs/error.log
```

---

**For detailed information, see [README.md](README.md), [API.md](API.md), and [EXAMPLES.md](EXAMPLES.md)**
