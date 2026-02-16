/**
 * Vercel serverless function: all routes rewritten here.
 * For POST /api/blogs/create with multipart, we parse here so multer works on Vercel.
 */
const path = require('path');
const fs = require('fs');
const multiparty = require('multiparty');

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

function isBlogCreateMultipart(req) {
  const method = (req.method || '').toUpperCase();
  if (method !== 'POST') return false;
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (!contentType.includes('multipart/form-data')) return false;
  const url = req.url || req.originalUrl || '';
  const pathname = url.split('?')[0].replace(/\/$/, '');
  return (
    pathname === '/blog/create' || pathname.endsWith('/blog/create') ||
    pathname === '/blogs/create' || pathname.endsWith('/blogs/create') ||
    pathname === '/api/blogs/create' || pathname.endsWith('/api/blogs/create')
  );
}

/**
 * Parse multipart in serverless and attach req.body + req.files (multer shape).
 * File objects: { fieldname, originalname, buffer, mimetype, size }.
 */
function parseMultipartForBlogCreate(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form({
      maxFieldsSize: 10 * 1024 * 1024,
      maxFilesSize: 4 * 1024 * 1024,
    });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const body = {};
        for (const [key, val] of Object.entries(fields || {})) {
          body[key] = Array.isArray(val) && val.length > 0 ? val[0] : '';
        }
        req.body = body;

        const filesMap = { coverImage: [], images: [] };
        for (const [fieldName, fileList] of Object.entries(files || {})) {
          if (!Array.isArray(fileList) || fileList.length === 0) continue;
          const arr = fieldName === 'coverImage' ? filesMap.coverImage : (filesMap.images || (filesMap.images = []));
          for (const f of fileList) {
            const buf = fs.existsSync(f.path) ? fs.readFileSync(f.path) : Buffer.alloc(0);
            const mimetype = (f.headers && f.headers['content-type']) ? f.headers['content-type'].split(';')[0].trim() : 'application/octet-stream';
            arr.push({
              fieldname: fieldName,
              originalname: f.originalFilename || 'image',
              buffer: buf,
              mimetype,
              size: buf.length,
            });
          }
        }
        req.files = filesMap;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = async (req, res) => {
  try {
    const { app, dbReady: ready } = loadApp();
    await ready;

    if (isBlogCreateMultipart(req)) {
      try {
        await parseMultipartForBlogCreate(req);
      } catch (parseErr) {
        const msg = parseErr && parseErr.message;
        console.error('[api] Multipart parse error:', msg);
        res.status(400).json({
          success: false,
          message: msg || 'Invalid multipart request',
        });
        return;
      }
    }

    return app(req, res);
  } catch (err) {
    const msg = err && err.message;
    console.error('[api] Error:', msg, err && err.stack);
    res.status(500).json({
      success: false,
      message: msg || 'Server error. Check Vercel Runtime Logs.',
    });
  }
};
