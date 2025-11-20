# Usage Examples

Real-world examples of using the PromptEnhance Backend API.

---

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Chrome Extension Integration](#chrome-extension-integration)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Advanced Examples](#advanced-examples)

---

## Basic Usage

### Example 1: Simple Prompt Enhancement

**Input**:
```javascript
const response = await fetch('http://localhost:3000/enhance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalPrompt: 'make a website for me'
  })
});

const data = await response.json();
console.log(data);
```

**Output**:
```json
{
  "enhancedPrompt": "Create a comprehensive, fully-functional website with the following specifications:\n\n**Project Requirements:**\n1. Purpose & Goals:\n   - Define the primary objective of the website\n   - Identify target audience and user personas\n   - Outline key features and functionality needed\n\n2. Design Requirements:\n   - Modern, responsive design that works on all devices\n   - Clean, professional layout with intuitive navigation\n   - Consistent branding (colors, fonts, logo placement)\n   - Accessible design following WCAG guidelines\n\n3. Technical Stack:\n   - Frontend: HTML5, CSS3, JavaScript (React/Vue/vanilla)\n   - Backend (if needed): Node.js, Python, or PHP\n   - Database (if needed): PostgreSQL, MongoDB, or MySQL\n   - Hosting: Specify preferred platform (Vercel, Netlify, AWS, etc.)\n\n4. Core Pages:\n   - Home page with hero section and key information\n   - About page describing purpose/mission\n   - Contact page with form and/or contact details\n   - [Add other specific pages as needed]\n\n5. Features:\n   - Contact form with validation\n   - Mobile-responsive navigation menu\n   - SEO optimization (meta tags, sitemap, structured data)\n   - Performance optimization (lazy loading, minification)\n   - Social media integration\n\n6. Content:\n   - Provide all text content, images, and media\n   - Specify content management needs (CMS integration?)\n\n7. Timeline & Budget:\n   - Desired completion date\n   - Budget constraints\n\n**Deliverables:**\n- Fully functional website\n- Source code repository\n- Documentation for maintenance\n- Deployment on specified hosting platform\n\nPlease confirm or modify these requirements before proceeding with development.",
  "usage": {
    "inputTokens": 67,
    "outputTokens": 342,
    "totalTokens": 409
  },
  "latencyMs": 2156
}
```

---

### Example 2: Code Request Enhancement

**Input**:
```json
{
  "originalPrompt": "write me a function that sorts numbers"
}
```

**Enhanced Output**:
```
Write a production-ready function that sorts an array of numbers with the following specifications:

**Function Requirements:**
1. Name: sortNumbers (or specify preferred name)
2. Input: Array of numbers (integers and/or floats)
3. Output: New sorted array (do not mutate original)

**Sorting Specifications:**
- Sort order: Ascending (smallest to largest)
- Handle edge cases:
  * Empty arrays → return empty array
  * Single element → return array with that element
  * Duplicate numbers → maintain all duplicates in sorted position
  * Mixed positive/negative numbers
  * Floating-point numbers
  * Very large arrays (performance considerations)

**Implementation Details:**
- Language: [Specify: JavaScript, Python, Java, etc.]
- Use efficient sorting algorithm (Quick Sort, Merge Sort, or built-in)
- Time complexity: O(n log n) or better
- Space complexity: Specify if in-place sorting is acceptable

**Code Quality:**
- Include clear comments explaining logic
- Add type hints/annotations where applicable
- Follow language-specific best practices
- Include input validation

**Testing:**
- Provide example test cases:
  * Normal case: [5, 2, 8, 1, 9] → [1, 2, 5, 8, 9]
  * Edge case: [] → []
  * Duplicates: [3, 1, 3, 2] → [1, 2, 3, 3]
  * Negatives: [-5, 3, -1, 0] → [-5, -1, 0, 3]

Please implement this function with complete documentation.
```

---

## Chrome Extension Integration

### Complete Extension Example

#### manifest.json
```json
{
  "manifest_version": 3,
  "name": "Prompt Enhancer",
  "version": "1.0.0",
  "description": "Enhance your prompts with AI",
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["http://localhost:3000/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  }
}
```

#### background.js
```javascript
// Rate limiting state
const requestCache = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minute

// Check rate limit
function checkRateLimit() {
  const now = Date.now();
  const recentRequests = Array.from(requestCache.values())
    .filter(time => now - time < RATE_WINDOW);

  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  return true;
}

// Handle enhancement requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'enhancePrompt') {
    // Check rate limit
    if (!checkRateLimit()) {
      sendResponse({
        success: false,
        error: 'Rate limit exceeded. Please wait a minute.'
      });
      return true;
    }

    // Record request
    const requestId = Date.now() + Math.random();
    requestCache.set(requestId, Date.now());

    // Make API call
    fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalPrompt: request.prompt
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => {
            throw new Error(err.message || 'Request failed');
          });
        }
        return response.json();
      })
      .then(data => {
        sendResponse({
          success: true,
          enhancedPrompt: data.enhancedPrompt,
          usage: data.usage,
          latencyMs: data.latencyMs
        });
      })
      .catch(error => {
        console.error('Enhancement error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      })
      .finally(() => {
        // Clean up old requests
        const now = Date.now();
        for (const [id, time] of requestCache.entries()) {
          if (now - time > RATE_WINDOW) {
            requestCache.delete(id);
          }
        }
      });

    return true; // Keep channel open for async response
  }

  if (request.action === 'healthCheck') {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    return true;
  }
});
```

#### content.js
```javascript
// Detect text input fields
function detectTextInputs() {
  const inputs = document.querySelectorAll('textarea, input[type="text"]');

  inputs.forEach(input => {
    // Skip if already enhanced
    if (input.dataset.promptEnhancerAdded) return;
    input.dataset.promptEnhancerAdded = 'true';

    // Add enhance button
    const button = document.createElement('button');
    button.textContent = '✨ Enhance';
    button.style.cssText = `
      position: absolute;
      z-index: 10000;
      padding: 4px 8px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 4px;
    `;

    button.addEventListener('click', async () => {
      const originalText = input.value;

      if (!originalText.trim()) {
        alert('Please enter some text first!');
        return;
      }

      // Show loading state
      button.disabled = true;
      button.textContent = '⏳ Enhancing...';

      try {
        const result = await enhancePrompt(originalText);

        if (result.success) {
          // Replace text with enhanced version
          input.value = result.enhancedPrompt;

          // Show success notification
          showNotification(
            `✅ Enhanced! Used ${result.usage.totalTokens} tokens in ${result.latencyMs}ms`,
            'success'
          );
        } else {
          showNotification(`❌ Error: ${result.error}`, 'error');
        }
      } catch (error) {
        showNotification(`❌ Failed: ${error.message}`, 'error');
      } finally {
        button.disabled = false;
        button.textContent = '✨ Enhance';
      }
    });

    // Insert button after input
    input.parentNode.insertBefore(button, input.nextSibling);
  });
}

// Enhance prompt via background script
function enhancePrompt(prompt) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'enhancePrompt', prompt },
      resolve
    );
  });
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100000;
    padding: 12px 20px;
    background: ${type === 'success' ? '#34a853' : '#ea4335'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
    font-size: 14px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Initialize
detectTextInputs();

// Re-run on DOM changes (for dynamic content)
const observer = new MutationObserver(detectTextInputs);
observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

---

## Error Handling

### Example: Comprehensive Error Handling

```javascript
async function enhancePromptWithErrorHandling(prompt) {
  try {
    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: prompt }),
      signal: AbortSignal.timeout(35000) // 35 second timeout
    });

    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json();

      switch (response.status) {
        case 400:
          throw new Error(`Invalid input: ${errorData.message}`);
        case 401:
          throw new Error('API key is invalid. Please check server configuration.');
        case 429:
          throw new Error('Too many requests. Please wait a minute and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        case 503:
          throw new Error('AI service is temporarily unavailable.');
        default:
          throw new Error(errorData.message || 'Unknown error occurred');
      }
    }

    const data = await response.json();
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('Enhancement failed:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out. Please try again.'
      };
    }

    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: 'Cannot connect to server. Is it running?'
      };
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await enhancePromptWithErrorHandling('make a website');
if (result.success) {
  console.log('Enhanced:', result.data.enhancedPrompt);
} else {
  console.error('Failed:', result.error);
}
```

---

## Rate Limiting

### Example: Client-Side Rate Limit Management

```javascript
class RateLimitedEnhancer {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest() {
    this.requests.push(Date.now());
  }

  getWaitTime() {
    if (this.canMakeRequest()) return 0;

    const oldestRequest = this.requests[0];
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }

  async enhance(prompt) {
    if (!this.canMakeRequest()) {
      const waitTime = this.getWaitTime();
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
      );
    }

    this.recordRequest();

    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  }
}

// Usage
const enhancer = new RateLimitedEnhancer();

try {
  const result = await enhancer.enhance('make a website');
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Advanced Examples

### Example: Batch Processing with Queue

```javascript
class EnhancementQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.delayBetweenRequests = 6000; // 6 seconds (10 req/min)
  }

  async add(prompt) {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      try {
        const response = await fetch('http://localhost:3000/enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalPrompt: item.prompt })
        });

        const data = await response.json();

        if (response.ok) {
          item.resolve(data);
        } else {
          item.reject(new Error(data.message));
        }
      } catch (error) {
        item.reject(error);
      }

      // Wait before next request
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
      }
    }

    this.processing = false;
  }
}

// Usage
const queue = new EnhancementQueue();

const prompts = [
  'make a website',
  'write a function',
  'create a database schema'
];

const results = await Promise.all(
  prompts.map(prompt => queue.add(prompt))
);

results.forEach((result, index) => {
  console.log(`Prompt ${index + 1}:`, result.enhancedPrompt);
});
```

### Example: Caching Enhanced Prompts

```javascript
class CachedEnhancer {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  getCacheKey(prompt) {
    return prompt.trim().toLowerCase();
  }

  async enhance(prompt) {
    const cacheKey = this.getCacheKey(prompt);

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('Cache hit!');
      return {
        ...this.cache.get(cacheKey),
        cached: true
      };
    }

    // Make API call
    const response = await fetch('http://localhost:3000/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalPrompt: prompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();

    // Store in cache
    this.cache.set(cacheKey, data);

    // Limit cache size
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return { ...data, cached: false };
  }

  clearCache() {
    this.cache.clear();
  }
}

// Usage
const enhancer = new CachedEnhancer();

const result1 = await enhancer.enhance('make a website');
console.log('First call:', result1.cached); // false

const result2 = await enhancer.enhance('make a website');
console.log('Second call:', result2.cached); // true
```

---

## Testing Examples

### Example: Unit Test with Mock Server

```javascript
// Using Jest
describe('PromptEnhancer', () => {
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  test('should enhance prompt successfully', async () => {
    const mockResponse = {
      enhancedPrompt: 'Enhanced prompt here...',
      usage: { inputTokens: 10, outputTokens: 50, totalTokens: 60 },
      latencyMs: 1000
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const result = await enhancePrompt('test prompt');

    expect(result.success).toBe(true);
    expect(result.data.enhancedPrompt).toBe('Enhanced prompt here...');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/enhance',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ originalPrompt: 'test prompt' })
      })
    );
  });

  test('should handle rate limit error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: true,
        message: 'Too many requests'
      })
    });

    const result = await enhancePrompt('test prompt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Too many requests');
  });
});
```

---

## Real-World Use Cases

### Use Case 1: ChatGPT Prompt Enhancer
Enhance prompts before sending them to ChatGPT or other AI tools.

### Use Case 2: Form Input Helper
Help users write better bug reports, support tickets, or feedback.

### Use Case 3: Email Composer
Enhance email drafts to be more professional and clear.

### Use Case 4: Code Comment Generator
Turn brief notes into comprehensive code documentation.

### Use Case 5: Search Query Optimizer
Enhance search queries for better results.

---

**For more examples, see [README.md](README.md) and [API.md](API.md)**
