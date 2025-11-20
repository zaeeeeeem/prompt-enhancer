# Quick Start Guide

Get the PromptEnhance Backend running in 5 minutes.

---

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed: `node --version`
- ✅ npm 9+ installed: `npm --version`
- ✅ A Google account (for Gemini API key)

---

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd Server
npm install
```

### Step 2: Get Gemini API Key (2 min)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### Step 3: Configure Environment (1 min)

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your API key
# You can use any text editor
nano .env
# or
code .env
# or
vim .env
```

**Minimum required configuration**:
```env
GEMINI_API_KEY=AIzaSy...your-key-here
```

That's it! Other settings have sensible defaults.

### Step 4: Start the Server (1 min)

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   PromptEnhance Backend Server                    ║
║   Status: Running                                 ║
║   Port: 3000                                      ║
╚═══════════════════════════════════════════════════╝
```

---

## Test It Works

### Option 1: Using curl

```bash
curl -X POST http://localhost:3000/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrompt": "make a website for me"
  }'
```

### Option 2: Using Browser

Open a new terminal and run:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T...",
  "uptime": 12.5,
  "environment": "development",
  "model": "gemini-2.0-flash-exp"
}
```

### Option 3: Using JavaScript Console

Open your browser console (F12) and run:
```javascript
fetch("http://localhost:3000/enhance", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ originalPrompt: "make a website for me" })
})
  .then(r => r.json())
  .then(console.log)
```

---

## Expected Response

You should get something like:

```json
{
  "enhancedPrompt": "Create a comprehensive, fully-functional website with the following specifications:\n\n**Project Requirements:**\n1. Purpose & Goals:\n   - Define the primary objective...",
  "usage": {
    "inputTokens": 67,
    "outputTokens": 342,
    "totalTokens": 409
  },
  "latencyMs": 1842
}
```

---

## Troubleshooting

### "Cannot find module" error
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "GEMINI_API_KEY is not configured"
- Check that `.env` file exists in the `Server/` directory
- Verify `GEMINI_API_KEY` is set (no quotes needed)
- Restart the server after changing `.env`

### "Port 3000 already in use"
Option 1: Change port in `.env`:
```env
PORT=3001
```

Option 2: Kill process using port 3000:
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Not allowed by CORS"
For local testing, this is expected. The server only allows Chrome extension origins by default.

To allow localhost for testing, set in `.env`:
```env
NODE_ENV=development
```

The server automatically allows localhost in development mode.

### "401 Unauthorized" or "Invalid API key"
- Your Gemini API key is invalid or expired
- Generate a new key from [AI Studio](https://aistudio.google.com/app/apikey)
- Update `.env` with the new key
- Restart the server

---

## Next Steps

### For Development:
1. ✅ Read [README.md](README.md) for full documentation
2. ✅ Check [API.md](API.md) for API reference
3. ✅ See [EXAMPLES.md](EXAMPLES.md) for code examples
4. ✅ Review [STRUCTURE.md](STRUCTURE.md) to understand the codebase

### For Chrome Extension:
1. ✅ Load your extension in Chrome (`chrome://extensions`)
2. ✅ Copy the extension ID
3. ✅ Update `.env`:
   ```env
   ALLOWED_ORIGIN=chrome-extension://your-extension-id-here
   ```
4. ✅ Restart the server
5. ✅ Test from your extension

### For Production:
1. ✅ Set `NODE_ENV=production` in `.env`
2. ✅ Run `npm run prod` instead of `npm run dev`
3. ✅ Set up proper hosting (see README.md)
4. ✅ Configure proper CORS origins
5. ✅ Set up monitoring and logging

---

## Useful Commands

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Build and run production
npm run prod

# Lint code
npm run lint

# Check logs (production only)
tail -f logs/combined.log
tail -f logs/error.log
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Server won't start | Check if port is available, verify `.env` exists |
| 400 Bad Request | Check request body has `originalPrompt` field |
| 429 Too Many Requests | Wait 1 minute, you've exceeded 10 req/min limit |
| 503 Service Unavailable | Gemini API is down or rate limited, try again later |
| No response | Check server is running, verify URL is correct |

---

## Getting Help

1. Check the [Troubleshooting](README.md#troubleshooting) section in README
2. Review the [API Documentation](API.md)
3. Look at [Examples](EXAMPLES.md) for code samples
4. Check server logs for detailed error messages
5. Verify your Gemini API key is valid

---

## What's Next?

Now that your server is running, you can:

- Integrate it with your Chrome extension
- Build a web interface
- Add it to your existing application
- Customize the prompt engineering template
- Add new features and endpoints

**Happy coding!** 🚀
