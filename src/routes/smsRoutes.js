import express from 'express';
const router = express.Router();
import {
  syncSms,
  syncSmsBatch,
  getUserSms,
  getAllSms,
  getSmsStatistics,
  deleteUserSms
} from '../controllers/smsController.js';
import { protect, adminProtect } from '../middleware/auth.js';

// Sync routes (called from mobile app)
router.post('/sync', protect, syncSms);
router.post('/sync-batch', protect, syncSmsBatch);

// Get routes
router.get('/user/:userId', protect, getUserSms);
router.get('/all', adminProtect, getAllSms);
router.get('/statistics', adminProtect, getSmsStatistics);

// Delete route (admin only)
router.delete('/user/:userId', adminProtect, deleteUserSms);

export default router;
