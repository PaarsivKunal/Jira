import express from 'express';
import {
  getForms,
  getForm,
  getFormByShareUrl,
  createForm,
  updateForm,
  deleteForm,
  submitForm,
  getFormSubmissions,
} from '../controllers/formController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/share/:shareUrl').get(getFormByShareUrl);
router.route('/:id/submit').post(submitForm);
router.route('/:id/submissions').get(protect, getFormSubmissions);
router
  .route('/:id')
  .get(protect, getForm)
  .put(protect, updateForm)
  .delete(protect, deleteForm);

export default router;

