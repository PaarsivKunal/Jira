import express from 'express';
import {
  getIssues,
  getIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  updateIssueStatus,
} from '../controllers/issueController.js';
import { getChildIssues, createChildIssue } from '../controllers/childIssueController.js';
import { getLinkedIssues, linkIssues, unlinkIssues } from '../controllers/linkController.js';
import { getWorkLogs, createWorkLog } from '../controllers/workLogController.js';
import { getActivities } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import {
  validateCreateIssue,
  validateUpdateIssue,
  validateUpdateIssueStatus,
  validateLinkIssue,
  validateMongoId,
  validatePagination,
} from '../middleware/validation.js';

const router = express.Router();

router
  .route('/')
  .get(protect, validatePagination, getIssues)
  .post(protect, validateCreateIssue, createIssue);

router
  .route('/:id/status')
  .patch(protect, validateMongoId('id'), validateUpdateIssueStatus, updateIssueStatus);

router
  .route('/:id/children')
  .get(protect, validateMongoId('id'), getChildIssues)
  .post(protect, validateMongoId('id'), validateCreateIssue, createChildIssue);

router
  .route('/:id/links')
  .get(protect, validateMongoId('id'), getLinkedIssues)
  .post(protect, validateMongoId('id'), validateLinkIssue, linkIssues);

router
  .route('/:id/links/:linkId')
  .delete(protect, validateMongoId('id'), validateMongoId('linkId'), unlinkIssues);

router
  .route('/:id/worklogs')
  .get(protect, validateMongoId('id'), getWorkLogs)
  .post(protect, validateMongoId('id'), createWorkLog);

router
  .route('/:id/activities')
  .get(protect, validateMongoId('id'), getActivities);

router
  .route('/:id')
  .get(protect, validateMongoId('id'), getIssue)
  .put(protect, validateMongoId('id'), validateUpdateIssue, updateIssue)
  .delete(protect, validateMongoId('id'), deleteIssue);

export default router;

