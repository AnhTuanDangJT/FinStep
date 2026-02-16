/**
 * Vercel serverless function: all routes rewritten here.
 * For POST /api/blogs/create with multipart, we read raw body then parse with busboy (works when stream is odd on Vercel).
 */
const path = require('path');
const Busboy = require('busboy');

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

/** Read request body into a Buffer (max 5MB). Uses stream or pre-buffered req.body (e.g. Vercel). */
function getRawBody(req) {
  const limit = 5 * 1024 * 1024;
  // Some runtimes (e.g. Vercel) may attach body as Buffer or base64 string
  const preBody = req.body;
  if (Buffer.isBuffer(preBody)) {
    if (preBody.length > limit) return Promise.reject(new Error('Request body too large'));
    return Promise.resolve(preBody);
  }
  if (typeof preBody === 'string' && preBody.length > 0) {
    const buf = Buffer.from(preBody, typeof req.encoding === 'string' ? req.encoding : 'utf8');
    if (buf.length > limit) return Promise.reject(new Error('Request body too large'));
    return Promise.resolve(buf);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let length = 0;
    req.on('data', (chunk) => {
      length += chunk.length;
      if (length > limit) {
        reject(new Error('Request body too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Parse multipart from buffer with busboy; attach req.body + req.files (multer shape).
 */
function parseMultipartFromBuffer(req, buffer) {
  return new Promise((resolve, reject) => {
    const body = {};
    const filesMap = { coverImage: [], images: [] };
    let pendingFiles = 0;
    let finished = false;

    const maybeDone = () => {
      if (finished && pendingFiles === 0) {
        req.body = body;
        req.files = filesMap;
        resolve();
      }
    };

    const busboy = Busboy({ headers: { 'content-type': req.headers['content-type'] || '' } });

    busboy.on('field', (name, value) => {
      body[name] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info || {};
      pendingFiles++;
      const chunks = [];
      file.on('data', (c) => chunks.push(c));
      file.on('end', () => {
        const buf = Buffer.concat(chunks);
        const arr = fieldname === 'coverImage' ? filesMap.coverImage : (filesMap.images || (filesMap.images = []));
        arr.push({
          fieldname,
          originalname: filename || 'image',
          buffer: buf,
          mimetype: mimeType || 'application/octet-stream',
          size: buf.length,
        });
        pendingFiles--;
        maybeDone();
      });
      file.on('error', (err) => {
        pendingFiles--;
        reject(err);
      });
    });

    busboy.on('error', reject);
    busboy.on('finish', () => {
      finished = true;
      maybeDone();
    });

    busboy.end(buffer);
  });
}

module.exports = async (req, res) => {
  try {
    const { app, dbReady: ready } = loadApp();
    await ready;

    if (isBlogCreateMultipart(req)) {
      try {
        const rawBody = await getRawBody(req);
        if (!rawBody || rawBody.length === 0) {
          res.status(400).json({
            success: false,
            message: 'Request body is empty. Send multipart/form-data with title, content, and coverImage or images.',
          });
          return;
        }
        await parseMultipartFromBuffer(req, rawBody);
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
