import express from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateCreateUser } from '../middleware/validation.js';

const router = express.Router();

router.route('/')
  .get(protect, getUsers)
  .post(protect, authorize('admin'), validateCreateUser, createUser);

router.route('/:id')
  .get(protect, getUser)
  .put(protect, authorize('admin'), updateUser)
  .delete(protect, authorize('admin'), deleteUser);

export default router;

