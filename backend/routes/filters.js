import express from 'express';
import {
  getFilters,
  getFilter,
  createFilter,
  updateFilter,
  deleteFilter,
} from '../controllers/filterController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getFilters).post(protect, createFilter);
router
  .route('/:id')
  .get(protect, getFilter)
  .put(protect, updateFilter)
  .delete(protect, deleteFilter);

export default router;

