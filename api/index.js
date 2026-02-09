/**
 * Vercel serverless function: all routes rewritten here.
 * Lazy-load app so load errors are caught and returned as 500 instead of crashing.
 */
const path = require('path');

let cachedApp = null;
let dbReady = null;

function loadApp() {
  if (cachedApp) return { app: cachedApp, dbReady };
  const distPath = path.join(__dirname, '..', 'dist');
  const { connectDB } = require(path.join(distPath, 'config', 'db'));
  cachedApp = require(path.join(distPath, 'app')).default;
  dbReady = connectDB().catch((err) => {
    console.error('[api] MongoDB connect error:', err && err.message);
  });
  return { app: cachedApp, dbReady };
}

module.exports = async (req, res) => {
  try {
    const { app, dbReady: ready } = loadApp();
    await ready;
    return app(req, res);
  } catch (err) {
    console.error('[api] Error:', err && err.message, err && err.stack);
    res.status(500).json({
      success: false,
      message: 'Server error. Check Vercel Runtime Logs.',
      hint: process.env.NODE_ENV !== 'production' ? (err && err.message) : undefined,
    });
  }
};
