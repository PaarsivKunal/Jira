import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import {
  validateCreateComment,
  validateUpdateComment,
  validateMongoId,
  validatePagination,
} from '../middleware/validation.js';

const router = express.Router();

router
  .route('/issues/:issueId/comments')
  .get(protect, validateMongoId('issueId'), validatePagination, getComments)
  .post(protect, validateMongoId('issueId'), validateCreateComment, createComment);

router
  .route('/:id')
  .put(protect, validateMongoId('id'), validateUpdateComment, updateComment)
  .delete(protect, validateMongoId('id'), deleteComment);

export default router;

