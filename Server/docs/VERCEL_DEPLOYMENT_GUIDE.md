# Vercel Deployment Guide - PromptEnhance Backend

This guide will walk you through deploying your PromptEnhance backend server to Vercel for production use.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Vercel CLI installed (optional but recommended)
- Your Google Gemini API key
- Your Chrome Extension ID

## Step 1: Prepare Your Project for Vercel

### 1.1 Create a `vercel.json` Configuration File

Create a file named `vercel.json` in the `Server` directory:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "dist/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "dist/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 1.2 Update `package.json` Build Scripts

Your current `package.json` already has the necessary scripts, but make sure the `build` script is present:

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "vercel-build": "npm run build"
}
```

### 1.3 Ensure TypeScript Configuration is Correct

Your `tsconfig.json` should output to the `dist` directory (already configured).

## Step 2: Deploy Using Vercel Dashboard (Easiest Method)

### 2.1 Push Your Code to GitHub

1. Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2.2 Import Project to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `Server` (important!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `GEMINI_API_KEY` | `your-actual-api-key` | Your Google Gemini API key |
| `MODEL` | `gemini-2.0-flash` | The Gemini model to use |
| `ALLOWED_ORIGIN` | `chrome-extension://*` | Allow all Chrome extensions (see note below) |
| `NODE_ENV` | `production` | Environment mode |
| `RATE_LIMIT_MAX` | `10` | Rate limit per minute |
| `MAX_BODY_SIZE` | `5kb` | Maximum request body size |
| `REQUEST_TIMEOUT_MS` | `30000` | Request timeout in milliseconds |
| `MAX_RETRIES` | `3` | Maximum retry attempts |
| `RETRY_DELAY_MS` | `1000` | Delay between retries |

**Important:** Never commit your actual `GEMINI_API_KEY` to GitHub. Only set it in Vercel's environment variables.

#### CORS Configuration Options

Your server already supports multiple CORS configurations:

1. **Allow ALL Chrome Extensions** (Current recommendation):
   - Set `ALLOWED_ORIGIN` to `chrome-extension://*` or leave it unset
   - Any Chrome extension can access your API
   - Good for public APIs or during development

2. **Allow a Specific Extension Only**:
   - Set `ALLOWED_ORIGIN` to `chrome-extension://your-extension-id`
   - Only your specific extension can access the API
   - More secure for production if you want to restrict access

3. **Allow Localhost (Development)**:
   - Automatically allowed when `NODE_ENV=development`
   - No additional configuration needed

The server's CORS logic (in `src/app.ts`) automatically allows any request from `chrome-extension://` origins, so you don't need to do anything special to allow all extensions.

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Once deployed, you'll get a production URL like: `https://your-project.vercel.app`

## Step 3: Deploy Using Vercel CLI (Alternative Method)

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Navigate to Server Directory

```bash
cd Server
```

### 3.4 Deploy to Production

```bash
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (first time)
- Project name? Accept default or choose your own
- Directory? `./` (current directory)

### 3.5 Add Environment Variables via CLI

```bash
vercel env add GEMINI_API_KEY
vercel env add MODEL
vercel env add ALLOWED_ORIGIN
vercel env add NODE_ENV
vercel env add RATE_LIMIT_MAX
```

After adding env variables, redeploy:

```bash
vercel --prod
```

## Step 4: Verify Deployment

### 4.1 Test Your Endpoints

Once deployed, test your API:

```bash
# Test health endpoint
curl https://your-project.vercel.app/health

# Test root endpoint
curl https://your-project.vercel.app/

# Test enhance endpoint
curl -X POST https://your-project.vercel.app/enhance \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test prompt", "context": "general"}'
```

### 4.2 Check Logs

View logs in the Vercel dashboard or via CLI:

```bash
vercel logs your-project.vercel.app
```

## Step 5: Update Your Chrome Extension

### 5.1 Update Extension Configuration

In your Chrome extension's configuration file, update the API endpoint to your Vercel URL:

```javascript
const API_BASE_URL = 'https://your-project.vercel.app';
```

### 5.2 Update CORS Settings (Optional)

Your server already allows all Chrome extensions by default. If you want to restrict access to only your specific extension:

```bash
vercel env add ALLOWED_ORIGIN production
# Enter: chrome-extension://your-extension-id
```

Then redeploy:

```bash
vercel --prod
```

**Note:** For allowing all extensions, you can either:
- Leave `ALLOWED_ORIGIN` unset (uses default `chrome-extension://*`)
- Or set it explicitly to `chrome-extension://*`

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions

### 6.2 Update Extension

Update your extension to use the custom domain instead of the Vercel URL.

## Step 7: Monitor and Maintain

### 7.1 Monitor Usage

- Check Vercel dashboard for:
  - Request metrics
  - Error rates
  - Build status
  - Function execution time

### 7.2 Set Up Alerts

Configure alerts in Vercel for:
- Deployment failures
- High error rates
- Usage limits

### 7.3 Update API Key Rotation

When rotating your Gemini API key:

1. Update the environment variable in Vercel:
   ```bash
   vercel env rm GEMINI_API_KEY production
   vercel env add GEMINI_API_KEY production
   ```

2. Redeploy:
   ```bash
   vercel --prod
   ```

## Important Notes

### Port Configuration

Vercel automatically assigns the PORT, so you don't need to set it. Your code already handles this correctly with:

```typescript
const PORT = parseInt(process.env.PORT || '3000', 10);
```

### Cold Starts

Vercel serverless functions may experience cold starts (first request takes longer). This is normal behavior.

### Function Timeouts

- **Hobby Plan**: 10 seconds max execution time
- **Pro Plan**: 60 seconds max execution time
- Your timeout is set to 30 seconds, which works on Pro plan

### Rate Limiting

Your rate limiting is per-instance. Consider using a shared Redis instance for production rate limiting across multiple Vercel instances.

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `dependencies`, not `devDependencies`
3. Verify TypeScript compiles locally: `npm run build`

### CORS Errors

1. Verify `ALLOWED_ORIGIN` matches your extension ID exactly
2. Check that extension ID is correct (get it from `chrome://extensions`)
3. Test with a tool like Postman to isolate CORS issues

### API Returns 500 Errors

1. Check Vercel function logs
2. Verify all environment variables are set
3. Test the Gemini API key separately

### Rate Limiting Issues

1. Adjust `RATE_LIMIT_MAX` if needed
2. Consider implementing Redis-based rate limiting for production

## Security Checklist

- [ ] `GEMINI_API_KEY` is set only in Vercel (not in code)
- [ ] `.env` file is in `.gitignore`
- [ ] `ALLOWED_ORIGIN` is set to your specific extension ID
- [ ] Rate limiting is configured appropriately
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] Helmet security headers are enabled (already configured)

## Deployment Workflow

For ongoing development:

1. Make changes locally
2. Test locally: `npm run dev`
3. Commit and push to GitHub: `git push origin main`
4. Vercel automatically deploys from `main` branch
5. Test production deployment
6. Monitor logs and metrics

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

## Support

If you encounter issues:
1. Check Vercel function logs
2. Review this guide
3. Check Vercel's status page
4. Contact Vercel support (Pro plan)

---

Your PromptEnhance backend is now ready for production on Vercel!
