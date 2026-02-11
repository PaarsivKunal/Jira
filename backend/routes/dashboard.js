import express from 'express';
import {
  getWidgets,
  getWidgetData,
  createWidget,
  updateWidget,
  deleteWidget,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/widgets').get(protect, getWidgets).post(protect, createWidget);
router.route('/widgets/:id/data').get(protect, getWidgetData);
router
  .route('/widgets/:id')
  .put(protect, updateWidget)
  .delete(protect, deleteWidget);

export default router;

