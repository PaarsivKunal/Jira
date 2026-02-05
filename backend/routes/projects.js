import express from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/projectController.js';
import { getProjectStats } from '../controllers/projectStatsController.js';
import { getForms, createForm } from '../controllers/formController.js';
import { getReports, createReport } from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { checkProjectAccess, checkProjectLead } from '../middleware/projectAccess.js';
import {
  validateCreateProject,
  validateUpdateProject,
  validateMongoId,
  validatePagination,
} from '../middleware/validation.js';

const router = express.Router();

router
  .route('/')
  .get(protect, validatePagination, getProjects)
  .post(protect, validateCreateProject, createProject);

router
  .route('/:id/stats')
  .get(protect, validateMongoId('id'), checkProjectAccess, getProjectStats);

router
  .route('/:projectId/forms')
  .get(protect, validateMongoId('projectId'), checkProjectAccess, getForms)
  .post(protect, validateMongoId('projectId'), checkProjectAccess, createForm);

router
  .route('/:projectId/reports')
  .get(protect, validateMongoId('projectId'), checkProjectAccess, getReports)
  .post(protect, validateMongoId('projectId'), checkProjectAccess, createReport);

router
  .route('/:id')
  .get(protect, validateMongoId('id'), checkProjectAccess, getProject)
  .put(protect, validateMongoId('id'), checkProjectAccess, checkProjectLead, validateUpdateProject, updateProject)
  .delete(protect, validateMongoId('id'), checkProjectAccess, checkProjectLead, deleteProject);

export default router;

