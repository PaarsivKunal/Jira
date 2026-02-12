import express from 'express';
import {
  getShortcuts,
  createShortcut,
  updateShortcut,
  deleteShortcut,
  deleteAllShortcuts,
} from '../controllers/shortcutController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/')
  .get(protect, getShortcuts)
  .post(protect, createShortcut)
  .delete(protect, deleteAllShortcuts);

router
  .route('/:id')
  .put(protect, updateShortcut)
  .delete(protect, deleteShortcut);

export default router;

