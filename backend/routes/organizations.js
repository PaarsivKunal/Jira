import express from 'express';
import { createOrganization, getMyOrganization, checkDomain } from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrganization);
router.get('/me', protect, getMyOrganization);
router.get('/check-domain', checkDomain);

export default router;

