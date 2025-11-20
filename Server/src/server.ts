/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */

import createApp from './app';
import logger from './utils/logger';
import http from 'http';

// Validate required environment variables
const requiredEnvVars = ['GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', {
    missing: missingEnvVars,
  });
  process.exit(1);
}

// Get port from environment or use default
const PORT = parseInt(process.env.PORT || '3000', 10);

// Create Express app
const app = createApp();

// Create HTTP server
const server = http.createServer(app);

// Start server
server.listen(PORT, () => {
  logger.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    model: process.env.MODEL || 'gemini-2.0-flash-exp',
    nodeVersion: process.version,
  });

  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   PromptEnhance Backend Server                    ║
║                                                   ║
║   Status: Running                                 ║
║   Port: ${PORT}                                       ║
║   Environment: ${process.env.NODE_ENV || 'development'}                        ║
║   Model: ${process.env.MODEL || 'gemini-2.0-flash-exp'}              ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /           - API info                   ║
║   • POST /enhance    - Enhance prompts            ║
║   • GET  /health     - Health check               ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections, cleanup, etc.
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    promise,
  });
  gracefulShutdown('unhandledRejection');
});

export default server;
