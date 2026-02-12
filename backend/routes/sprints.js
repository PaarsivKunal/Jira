import express from 'express';
import {
    getSprints,
    createSprint,
    updateSprint,
    deleteSprint,
} from '../controllers/sprintController.js';
import { protect } from '../middleware/auth.js';
import { validateMongoId } from '../middleware/validation.js';

const router = express.Router();

router
    .route('/')
    .get(protect, getSprints)
    .post(protect, createSprint);

router
    .route('/:id')
    .put(protect, validateMongoId('id'), updateSprint)
    .delete(protect, validateMongoId('id'), deleteSprint);

export default router;
