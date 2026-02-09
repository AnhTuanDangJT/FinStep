/**
 * Vercel serverless entry for the Express backend.
 * Used only when deploying the backend to Vercel (FinStep API project).
 *
 * Build must run first (npm run build) so dist/app.js and dist/config/db.js exist.
 * This file connects MongoDB then exports the Express app so Vercel can run it as a function.
 */
const { connectDB } = require('./dist/config/db');

// Start DB connection when the function loads (non-blocking)
let dbReady = connectDB().catch(() => {});

const app = require('./dist/app').default;

// Export a handler that ensures DB is connected before passing request to Express
module.exports = async (req, res) => {
  await dbReady;
  return app(req, res);
};
