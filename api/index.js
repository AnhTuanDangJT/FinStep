/**
 * Vercel serverless function: all routes are rewritten here.
 * Requires dist/ from npm run build. vercel.json includes dist/** in this function.
 */
const { connectDB } = require('../dist/config/db');

let dbReady = connectDB().catch((err) => {
  console.error('[api] MongoDB connect error:', err && err.message);
});

const app = require('../dist/app').default;

module.exports = async (req, res) => {
  try {
    await dbReady;
    return app(req, res);
  } catch (err) {
    console.error('[api] Handler error:', err && err.message);
    res.status(500).json({
      success: false,
      message: 'Server error. Check Vercel Runtime Logs and env vars (MONGODB_URI, JWT_ACCESS_SECRET, etc.).',
    });
  }
};
