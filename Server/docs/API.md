# API Documentation

## PromptEnhance Backend API

Complete API reference for the PromptEnhancer backend server.

---

## Base URL

```
http://localhost:3000
```

For production, replace with your deployed server URL.

---

## Authentication

Currently, this API does not require authentication. Security is enforced through:
- CORS restrictions (Chrome extension origins only)
- Rate limiting per IP address

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 30 requests | Per minute per IP |
| `/enhance` | 10 requests | Per minute per IP |

When rate limit is exceeded, the API returns:
```json
{
  "error": true,
  "message": "Too many requests. Please try again later."
}
```
**Status Code**: `429 Too Many Requests`

---

## Endpoints

### 1. Root / API Info

Get information about the API.

#### Request
```http
GET / HTTP/1.1
Host: localhost:3000
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

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

---

### 2. Enhance Prompt

Enhance a user-written prompt using Google Gemini AI.

#### Request
```http
POST /enhance HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "originalPrompt": "make a website for me"
}
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `originalPrompt` | string | Yes | The prompt text to enhance. Must be non-empty. |

#### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "enhancedPrompt": "Create a responsive, modern website with the following requirements:\n\n1. Design & Layout:\n- Clean, professional design\n- Mobile-responsive layout...",
  "usage": {
    "inputTokens": 42,
    "outputTokens": 156,
    "totalTokens": 198
  },
  "latencyMs": 1842
}
```

**Response Fields**:
- `enhancedPrompt` (string): The AI-enhanced version of the prompt
- `usage` (object): Token usage statistics
  - `inputTokens` (number): Tokens in the input
  - `outputTokens` (number): Tokens generated
  - `totalTokens` (number): Total tokens used
- `latencyMs` (number): Request processing time in milliseconds

#### Error Responses

**Missing originalPrompt**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": true,
  "message": "originalPrompt is required"
}
```

**Invalid Content-Type**:
```http
HTTP/1.1 415 Unsupported Media Type
Content-Type: application/json

{
  "error": true,
  "message": "Content-Type must be application/json"
}
```

**Empty or Invalid Prompt**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": true,
  "message": "originalPrompt must be a non-empty string with valid content"
}
```

**Rate Limit Exceeded**:
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": true,
  "message": "Too many requests. Please try again later."
}
```

**Gemini API Error**:
```http
HTTP/1.1 503 Service Unavailable
Content-Type: application/json

{
  "error": true,
  "message": "Failed to enhance prompt after multiple attempts. Please try again later."
}
```

**Invalid API Key**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": true,
  "message": "Invalid or missing Gemini API key"
}
```

---

### 3. Health Check

Check server health and status.

#### Request
```http
GET /health HTTP/1.1
Host: localhost:3000
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "healthy",
  "timestamp": "2025-01-20T12:34:56.789Z",
  "uptime": 3600.5,
  "environment": "development",
  "model": "gemini-2.0-flash-exp"
}
```

**Response Fields**:
- `status` (string): Server health status
- `timestamp` (string): Current server time (ISO 8601)
- `uptime` (number): Server uptime in seconds
- `environment` (string): Current environment (development/production)
- `model` (string): Gemini model being used

---

## HTTP Status Codes

| Code | Name | Description |
|------|------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request body or parameters |
| 401 | Unauthorized | Invalid Gemini API key |
| 404 | Not Found | Endpoint does not exist |
| 415 | Unsupported Media Type | Wrong Content-Type header |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Invalid response from Gemini API |
| 503 | Service Unavailable | Gemini API unavailable or all retries failed |
| 504 | Gateway Timeout | Gemini API request timeout |

---

## Example Requests

### JavaScript (fetch)

```javascript
async function enhancePrompt(prompt) {
  try {
    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalPrompt: prompt
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Enhanced:', data.enhancedPrompt);
    console.log('Tokens:', data.usage.totalTokens);
    console.log('Latency:', data.latencyMs + 'ms');

    return data;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Usage
enhancePrompt('make a website for me');
```

### JavaScript (Axios)

```javascript
const axios = require('axios');

async function enhancePrompt(prompt) {
  try {
    const response = await axios.post('http://localhost:3000/enhance', {
      originalPrompt: prompt
    });

    console.log('Enhanced:', response.data.enhancedPrompt);
    console.log('Tokens:', response.data.usage.totalTokens);

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.message);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Usage
enhancePrompt('make a website for me');
```

### cURL

```bash
# Enhance a prompt
curl -X POST http://localhost:3000/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "originalPrompt": "make a website for me"
  }'

# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/
```

### Python (requests)

```python
import requests

def enhance_prompt(prompt):
    url = 'http://localhost:3000/enhance'
    headers = {'Content-Type': 'application/json'}
    data = {'originalPrompt': prompt}

    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()

        result = response.json()
        print('Enhanced:', result['enhancedPrompt'])
        print('Tokens:', result['usage']['totalTokens'])
        print('Latency:', result['latencyMs'], 'ms')

        return result
    except requests.exceptions.RequestException as e:
        print('Error:', e)
        raise

# Usage
enhance_prompt('make a website for me')
```

---

## Chrome Extension Integration

### Manifest Configuration

Add host permissions in `manifest.json`:

```json
{
  "manifest_version": 3,
  "host_permissions": [
    "http://localhost:3000/*"
  ]
}
```

For production:
```json
{
  "host_permissions": [
    "https://your-api-domain.com/*"
  ]
}
```

### Background Script Example

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: request.prompt })
    })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    return true; // Keep channel open
  }
});
```

### Content Script Example

```javascript
// content.js
function enhanceText(text) {
  chrome.runtime.sendMessage(
    { action: 'enhancePrompt', prompt: text },
    (response) => {
      if (response.success) {
        console.log('Enhanced:', response.data.enhancedPrompt);
      } else {
        console.error('Error:', response.error);
      }
    }
  );
}
```

---

## Webhook Integration (Optional)

If you want to add webhook support for async processing:

```javascript
// Example webhook request
POST /enhance
{
  "originalPrompt": "make a website",
  "webhookUrl": "https://your-app.com/callback"
}

// Server will POST result to webhookUrl:
POST https://your-app.com/callback
{
  "enhancedPrompt": "...",
  "usage": {...},
  "latencyMs": 1234
}
```

Note: Webhooks are not currently implemented but can be added to the controller.

---

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Rate Limiting**: Implement client-side throttling
3. **Retry Logic**: Use exponential backoff for retries
4. **Timeouts**: Set reasonable request timeouts
5. **Logging**: Log requests for debugging
6. **Caching**: Cache enhanced prompts when possible

---

## Support

For API issues or questions:
- Check the main [README.md](README.md)
- Review server logs for detailed error information
- Ensure environment variables are correctly configured
- Verify Gemini API key is valid

---

**Last Updated**: January 2025
