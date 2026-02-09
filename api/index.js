/**
 * Vercel serverless function: all routes are rewritten here.
 * Requires dist/ from npm run build (run at project root).
 */
const { connectDB } = require('../dist/config/db');

let dbReady = connectDB().catch(() => {});

const app = require('../dist/app').default;

module.exports = async (req, res) => {
  await dbReady;
  return app(req, res);
};
