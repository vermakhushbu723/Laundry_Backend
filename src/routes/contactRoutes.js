import express from 'express';
import { 
  syncContacts, 
  getMyContacts, 
  deleteMyContacts 
} from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected (require authentication)
router.use(protect);

// Sync contacts from mobile app
router.post('/sync', syncContacts);

// Get user's contacts
router.get('/my-contacts', getMyContacts);

// Delete user's contacts
router.delete('/my-contacts', deleteMyContacts);

export default router;
