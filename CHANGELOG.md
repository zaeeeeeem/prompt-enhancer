# Changelog

All notable changes to the PromptEnhance Backend project.

---

## [1.1.0] - 2025-11-20

### Added
- **Markdown Sanitization**: Enhanced prompts now automatically have markdown formatting removed
  - Removes bold (`**text**`), italics (`*text*`), and inline code (`` `code` ``)
  - Cleans up headers (`# Header`), links (`[text](url)`), and code blocks
  - Normalizes whitespace and line breaks
  - Returns clean, plain-text formatted prompts ready for display
- New utility function: `markdownToPlainText()` in [src/utils/sanitize.ts](src/utils/sanitize.ts)
- Markdown sanitization test script: [test-markdown.js](test-markdown.js)

### Changed
- Gemini API responses are now processed through markdown sanitization before being returned
- Enhanced prompts are cleaner and more suitable for direct use in text fields

### Technical Details
The backend now performs the following transformations on Gemini responses:

**Before** (with markdown):
```
**Project Requirements:**
- Purpose & Goals
  * Define the primary objective
- Design Requirements:
  * Modern, `responsive` design
```

**After** (plain text):
```
Project Requirements:
- Purpose & Goals
- Define the primary objective
- Design Requirements:
- Modern, responsive design
```

---

## [1.0.0] - 2025-11-20

### Initial Release

#### Features
- Complete TypeScript backend with Express.js
- Google Gemini 2.0 Flash API integration
- Prompt enhancement with AI-powered optimization
- Security features:
  - CORS protection (Chrome extension origins only)
  - Rate limiting (10 req/min per IP)
  - Input sanitization and validation
  - Security headers via Helmet
- Reliability features:
  - Automatic retry with exponential backoff (max 3 attempts)
  - 30-second timeout handling
  - Graceful shutdown
  - Exception handling
- Monitoring:
  - Winston structured logging
  - Token usage tracking
  - Latency measurement
  - Request/error logging
- API Endpoints:
  - `POST /enhance` - Enhance prompts
  - `GET /health` - Health check
  - `GET /` - API information

#### Documentation
- Complete setup guide ([README.md](README.md))
- API reference ([API.md](API.md))
- Usage examples ([EXAMPLES.md](EXAMPLES.md))
- Architecture overview ([ARCHITECTURE.md](ARCHITECTURE.md))
- Project structure guide ([STRUCTURE.md](STRUCTURE.md))
- Quick start guide ([QUICKSTART.md](QUICKSTART.md))

#### Testing
- API test script ([test-api.sh](test-api.sh))
- Simple test script ([test-simple.js](test-simple.js))

---

## Upgrade Guide

### From 1.0.0 to 1.1.0

No breaking changes. The markdown sanitization feature is applied automatically.

**What changes in your extension:**
- Enhanced prompts will no longer contain markdown formatting
- Text can be displayed directly without markdown processing
- No code changes required on the client side

**To verify the new feature:**
```bash
node test-markdown.js
```

This will show before/after comparison and verify all markdown artifacts are removed.

---

## Future Roadmap

### Planned Features
- [ ] Caching layer for frequently enhanced prompts
- [ ] Database integration for usage analytics
- [ ] Multiple prompt templates
- [ ] Batch enhancement endpoint
- [ ] Webhook support for async processing
- [ ] Response streaming for large prompts
- [ ] Custom enhancement styles
- [ ] Multi-language support

### Under Consideration
- [ ] User authentication
- [ ] API key management
- [ ] Usage quotas per user
- [ ] A/B testing of different enhancement strategies
- [ ] Prompt history tracking
- [ ] Analytics dashboard

---

## Version History

| Version | Date | Key Changes |
|---------|------|-------------|
| 1.1.0 | 2025-11-20 | Markdown sanitization |
| 1.0.0 | 2025-11-20 | Initial release |

---

## Contributing

When contributing, please:
1. Update this CHANGELOG with your changes
2. Follow semantic versioning
3. Add tests for new features
4. Update relevant documentation

---

## Support

For issues or questions:
- Check the [README.md](README.md) troubleshooting section
- Review the [API.md](API.md) documentation
- See [EXAMPLES.md](EXAMPLES.md) for usage patterns
