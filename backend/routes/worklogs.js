import express from 'express';
import {
  updateWorkLog,
  deleteWorkLog,
} from '../controllers/workLogController.js';
import { protect } from '../middleware/auth.js';
import { validateMongoId } from '../middleware/validation.js';

const router = express.Router();

router.route('/:id')
  .put(protect, validateMongoId('id'), updateWorkLog)
  .delete(protect, validateMongoId('id'), deleteWorkLog);

export default router;

