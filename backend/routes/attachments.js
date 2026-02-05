import express from 'express';
import {
  getAttachments,
  getIssueAttachments,
  uploadAttachment,
  uploadProjectAttachment,
  downloadAttachment,
  getAttachment,
  deleteAttachment,
} from '../controllers/attachmentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/projects/:projectId/attachments')
  .get(protect, getAttachments)
  .post(protect, uploadProjectAttachment);
router
  .route('/issues/:issueId/attachments')
  .get(protect, getIssueAttachments)
  .post(protect, uploadAttachment);
router.route('/:id/download').get(protect, downloadAttachment);
router
  .route('/:id')
  .get(protect, getAttachment)
  .delete(protect, deleteAttachment);

export default router;

