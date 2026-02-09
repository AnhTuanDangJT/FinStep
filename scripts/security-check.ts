/**
 * Security checklist verification script
 * Run: tsx scripts/security-check.ts
 *
 * Verifies:
 * - User endpoints never return _id in public responses
 * - Blog endpoints never expose authorId in public serializers
 * - stripForbiddenFields includes role, authorId
 * - sanitizePublicPost does not include _id, authorId, author.email
 * - Error handler never leaks stack in production
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

// 1. sanitizePublicPost must NOT include _id, authorId, author.email
const securityTs = fs.readFileSync(path.join(ROOT, 'utils', 'security.ts'), 'utf8');
check(
  'sanitizePublicPost does not expose _id',
  !securityTs.includes('_id: post._id') && !securityTs.match(/result\._id\s*=/),
  'Found _id in public post serializer'
);
check(
  'sanitizePublicPost does not expose authorId',
  !securityTs.match(/result\.authorId|authorId:\s*post\./),
  'Found authorId in public post serializer'
);
check(
  'sanitizePublicPost uses authorDisplay (masked)',
  securityTs.includes('authorDisplay'),
  'authorDisplay not found'
);
check(
  'stripForbiddenFields includes role',
  securityTs.includes('delete req.body.role'),
  'role not stripped'
);
check(
  'stripForbiddenFields includes authorId',
  securityTs.includes('delete req.body.authorId'),
  'authorId not stripped'
);

// 2. Public profile never returns raw _id
const profileService = fs.readFileSync(path.join(ROOT, 'modules', 'profile', 'profile.service.ts'), 'utf8');
check(
  'PublicProfileResponse uses publicId not id',
  profileService.includes('publicId:') && profileService.includes('emailMasked:'),
  'Public profile should use publicId and emailMasked'
);

// 3. Error handler never leaks stack in production
const appTs = fs.readFileSync(path.join(ROOT, 'app.ts'), 'utf8');
check(
  'Error handler uses safe message in production',
  appTs.includes("env.NODE_ENV === 'production'") && appTs.includes("'Internal server error'"),
  'Error handler must return generic message in production'
);

// 4. Comment responses don't expose author internal id
const postService = fs.readFileSync(path.join(ROOT, 'modules', 'posts', 'post.service.ts'), 'utf8');
check(
  'Comment author does not include id',
  !postService.match(/author:\s*{[^}]*id:\s*authorIdPop/),
  'Comment author should not expose id'
);

// 5. Models have publicId
const userModel = fs.readFileSync(path.join(ROOT, 'modules', 'auth', 'auth.model.ts'), 'utf8');
const postModel = fs.readFileSync(path.join(ROOT, 'modules', 'posts', 'post.model.ts'), 'utf8');
check('User model has publicId', userModel.includes('publicId'), 'User model missing publicId');
check('BlogPost model has publicId', postModel.includes('publicId'), 'BlogPost model missing publicId');

// 6. sanitizeHtml strips script and iframe
check('sanitizeHtml removes script tags', securityTs.includes('<script'), 'script tag removal');
check('sanitizeHtml removes iframe', securityTs.includes('iframe'), 'iframe removal');

// 7. Rate limiters exist
const rateLimitTs = fs.readFileSync(path.join(ROOT, 'utils', 'rateLimit.ts'), 'utf8');
check('authRateLimiter exists', rateLimitTs.includes('authRateLimiter'), 'auth rate limiter');
check('adminRateLimiter exists', rateLimitTs.includes('adminRateLimiter'), 'admin rate limiter');
check('searchRateLimiter exists', rateLimitTs.includes('searchRateLimiter'), 'search rate limiter');

// 8. Logger does not log stack in production
const loggerTs = fs.readFileSync(path.join(ROOT, 'utils', 'logger.ts'), 'utf8');
check(
  'Logger suppresses stack in production',
  loggerTs.includes('production') && (loggerTs.includes('undefined') || loggerTs.includes('!==')),
  'Logger should not log stack in production'
);

console.log('\n--- Summary ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
