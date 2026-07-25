import express from 'express';
import leaderboardController from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/top', leaderboardController.getTopUsers);
router.get('/rank/:userId', leaderboardController.getUserRank);

export default router;
