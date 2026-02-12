import express from 'express';
import { getUsers, getUser, createUser, updateUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(protect, getUsers).post(protect, createUser);
router.route('/:id').get(protect, getUser).put(protect, updateUser);

export default router;

