/**
 * Vercel Serverless Function Entry Point
 * Exports the Express app for Vercel's serverless platform
 */

import createApp from '../src/app';

// Create and export the Express app for Vercel
const app = createApp();

// Export for Vercel serverless functions
export default app;
