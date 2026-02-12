import express from 'express';
import {
  getMicrosoftAuthUrl,
  handleMicrosoftCallback,
  getIntegrationStatus,
  getUserTeamsList,
  getChannels,
  configureTeamsChannel,
  updateSettings,
  disconnectIntegration,
  testMicrosoftConfig,
} from '../controllers/microsoftIntegrationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/auth-url', protect, getMicrosoftAuthUrl);
router.get('/callback', handleMicrosoftCallback);
router.get('/status', protect, getIntegrationStatus);
router.get('/teams', protect, getUserTeamsList);
router.get('/teams/:teamId/channels', protect, getChannels);
router.post('/teams/configure', protect, configureTeamsChannel);
router.put('/settings', protect, updateSettings);
router.post('/disconnect', protect, disconnectIntegration);
router.get('/test-config', protect, testMicrosoftConfig);

export default router;

