import express from 'express';
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  getReportData,
} from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/projects/:projectId/reports').get(protect, getReports).post(protect, createReport);
router.route('/:id/data').get(protect, getReportData);
router
  .route('/:id')
  .get(protect, getReport)
  .put(protect, updateReport)
  .delete(protect, deleteReport);

export default router;

