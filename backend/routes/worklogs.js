import express from 'express';
import {
  updateWorkLog,
  deleteWorkLog,
} from '../controllers/workLogController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/:id').put(protect, updateWorkLog).delete(protect, deleteWorkLog);

export default router;

