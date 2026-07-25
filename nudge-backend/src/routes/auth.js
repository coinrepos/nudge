import express from 'express';
import authController from '../controllers/authController.js';
import { auth, authLimiter } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/profile', auth, authController.getProfile);

export default router;
