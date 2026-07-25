import express from 'express';
import creditController from '../controllers/creditController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/spin', optionalAuth, creditController.recordSpin);
router.get('/balance', auth, creditController.getBalance);
router.get('/stats', auth, creditController.getStats);

export default router;
