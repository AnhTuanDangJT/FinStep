import { Router, type RequestHandler } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { requireAdmin, requireSuperAdmin } from './admin.middleware';
import { stripForbiddenFields } from '../../utils/security';
import {
  listMentorshipRegistrationsHandler,
  exportMentorshipRegistrationsHandler,
  deleteMentorshipRegistrationHandler,
} from '../mentorship/mentorship.controller';
import {
  adminAuthMeHandler,
  getAdminOverviewHandler,
  getUsers,
  getUserDetailHandler,
  addAdmin,
  removeAdmin,
  approvePostHandler,
  rejectPostHandler,
  reviewBlogHandler,
  getAdminPosts,
  getPendingPostsHandler,
  getMentorsHandler,
  verifyMentorHandler,
  getPendingBlogsHandler,
  getApprovedBlogsForAdminHandler,
  approveBlogHandler,
  rejectBlogHandler,
  featureBlogHandler,
  pinBlogHandler,
  gradeBlogHandler,
  getNotesHandler,
  addNoteHandler,
  getAnalyticsHandler,
  softBanUserHandler,
  setCredibilityHandler,
  adjustCredibilityByUserIdHandler,
  adjustCredibilityHandler,
  adjustCredibilityByEmailHandler,
  suspendUserHandler,
  unsuspendUserHandler,
  promoteAdminHandler,
  getCredibilityHistoryHandler,
  getAdminUserPostsHandler,
} from './admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate as RequestHandler);
router.use(requireAdmin as RequestHandler);

// Admin auth check – GET /api/admin/auth/me or GET /admin/auth/me
router.get('/auth/me', adminAuthMeHandler as RequestHandler);

// Admin dashboard overview (counts only) – GET /api/admin/overview or GET /admin/overview
router.get('/overview', getAdminOverviewHandler as RequestHandler);

// Admin user management (never expose internal userId; use publicId/email)
router.get('/users', getUsers as RequestHandler);
router.get('/users/:email/credibility-history', getCredibilityHistoryHandler as RequestHandler);
router.get('/users/:publicId/posts', getAdminUserPostsHandler as RequestHandler);
router.get('/users/:publicId', getUserDetailHandler as RequestHandler);
router.patch('/users/:userId/soft-ban', stripForbiddenFields, softBanUserHandler as RequestHandler);
router.post('/users/:userId/credibility', stripForbiddenFields, adjustCredibilityByUserIdHandler as RequestHandler);
router.patch('/users/:userId/credibility', stripForbiddenFields, setCredibilityHandler as RequestHandler);

// Promote admin by email (SUPER_ADMIN only)
router.post('/users/promote-admin', requireSuperAdmin as RequestHandler, stripForbiddenFields, promoteAdminHandler as RequestHandler);
router.post('/users/adjust-credibility', stripForbiddenFields, adjustCredibilityByEmailHandler as RequestHandler);

// Add/remove admin – super admin only (legacy paths)
router.post('/promote-admin', requireSuperAdmin as RequestHandler, stripForbiddenFields, addAdmin as RequestHandler);
router.post('/add-admin', requireSuperAdmin as RequestHandler, stripForbiddenFields, addAdmin as RequestHandler);
router.post('/admins/add', requireSuperAdmin as RequestHandler, stripForbiddenFields, addAdmin as RequestHandler);
router.post('/admins/remove', requireSuperAdmin as RequestHandler, stripForbiddenFields, removeAdmin as RequestHandler);

// Legacy adjust by userId (keep for backward compat)
router.post('/adjust-credibility', stripForbiddenFields, adjustCredibilityHandler as RequestHandler);
router.post('/suspend-user', stripForbiddenFields, suspendUserHandler as RequestHandler);
router.post('/unsuspend-user', stripForbiddenFields, unsuspendUserHandler as RequestHandler);

// Admin post management (spec: POST /admin/approve/:id, GET /admin/posts)
router.get('/pending-posts', getPendingPostsHandler as RequestHandler); // spec: GET /api/admin/pending-posts
router.get('/posts/pending', getPendingPostsHandler as RequestHandler); // frontend: GET /admin/posts/pending
router.get('/posts', getAdminPosts as RequestHandler);
router.post('/approve/:id', approvePostHandler as RequestHandler);
router.post('/posts/:id/approve', approvePostHandler as RequestHandler); // legacy
router.post('/posts/:id/reject', rejectPostHandler as RequestHandler);
router.post('/reject/:id', rejectPostHandler as RequestHandler); // spec: POST /api/admin/reject/:id

// Blog moderation (spec: GET /admin/blogs/pending, POST approve/reject, PATCH feature/pin)
router.get('/blogs/pending', getPendingBlogsHandler as RequestHandler);
router.get('/blogs/approved', getApprovedBlogsForAdminHandler as RequestHandler);
router.post('/blogs/:id/approve', approveBlogHandler as RequestHandler);
router.post('/blogs/:id/reject', stripForbiddenFields, rejectBlogHandler as RequestHandler);
router.post('/blogs/:id/grade', stripForbiddenFields, gradeBlogHandler as RequestHandler);
router.patch('/blogs/:id/feature', stripForbiddenFields, featureBlogHandler as RequestHandler);
router.patch('/blogs/:id/pin', stripForbiddenFields, pinBlogHandler as RequestHandler);
// Legacy PATCH review
router.patch('/blogs/:id/review', reviewBlogHandler as RequestHandler);

// Admin notes (internal only; never visible to users)
router.get('/notes', getNotesHandler as RequestHandler);
router.post('/notes', stripForbiddenFields, addNoteHandler as RequestHandler);

// Analytics
router.get('/analytics', getAnalyticsHandler as RequestHandler);

// Mentor management (admin)
router.get('/mentors', getMentorsHandler as RequestHandler);
router.post('/mentors/:userId/verify', stripForbiddenFields, verifyMentorHandler as RequestHandler);

// Mentorship program registrations (admin)
router.get('/mentorship/registrations', listMentorshipRegistrationsHandler as RequestHandler);
router.get('/mentorship/registrations/export', exportMentorshipRegistrationsHandler as RequestHandler);
router.delete('/mentorship/registrations/:id', deleteMentorshipRegistrationHandler as RequestHandler);

export default router;

