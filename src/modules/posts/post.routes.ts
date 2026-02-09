import { Router, type RequestHandler } from 'express';
import { authenticate, optionalAuthenticate } from '../auth/auth.middleware';
import { stripForbiddenFields } from '../../utils/security';
import {
  getPublicPosts,
  getPostBySlugHandler,
  getPostByIdHandler,
  getCommentsHandler,
  getShareUrlHandler,
  createPostHandler,
  getMyPosts,
  updatePostHandler,
  deletePostHandler,
  submitPostHandler,
  toggleLikeHandler,
  addCommentHandler,
  addPostUpdateHandler,
  getPostUpdatesHandler,
  getRecommendedPostsHandler,
} from './post.controller';

const router = Router();

// Public routes (Community Finance Feed - approved posts only)
router.get('/', getPublicPosts);
router.get('/recommended', optionalAuthenticate as RequestHandler, getRecommendedPostsHandler as RequestHandler); // Before /:id
router.get('/slug/:slug', getPostBySlugHandler);
router.get('/by-slug/:slug', getPostBySlugHandler); // Alias for shareable links /blogs/[slug]
router.get('/mine', authenticate, getMyPosts as RequestHandler); // Before /:id so "mine" is not captured as id
router.get('/me', authenticate, getMyPosts as RequestHandler); // Frontend calls /posts/me; same as /mine
router.get('/:id/comments', optionalAuthenticate as RequestHandler, getCommentsHandler as RequestHandler);
router.get('/:id/updates', getPostUpdatesHandler as RequestHandler);
router.get('/:id', optionalAuthenticate as RequestHandler, getPostByIdHandler as RequestHandler);

// Share URL (optional auth - public for APPROVED)
router.post('/:id/share', optionalAuthenticate as RequestHandler, getShareUrlHandler as RequestHandler);

// Submit post (DRAFT/REJECTED -> PENDING)
router.post('/:id/submit', authenticate, submitPostHandler as RequestHandler);

// Authenticated routes
router.post('/', authenticate, stripForbiddenFields, createPostHandler as RequestHandler);
router.post('/:id/like', authenticate, toggleLikeHandler as RequestHandler);
router.delete('/:id/like', authenticate, toggleLikeHandler as RequestHandler); // unlike (toggle)
router.post('/:id/comment', optionalAuthenticate as RequestHandler, addCommentHandler as RequestHandler);
router.post('/:id/updates', authenticate, addPostUpdateHandler as RequestHandler);
router.put('/:id', authenticate, stripForbiddenFields, updatePostHandler as RequestHandler);
router.delete('/:id', authenticate, deletePostHandler as RequestHandler);

export default router;

