import express from 'express';
import nudgeCashController from '../controllers/nudgeCashController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// User endpoints (require auth)
router.get('/balance', auth, nudgeCashController.getBalance);
router.get('/transactions', auth, nudgeCashController.getTransactions);
router.get('/stats', auth, nudgeCashController.getStats);
router.get('/clicks', auth, nudgeCashController.getClickHistory);
router.get('/withdrawals', auth, nudgeCashController.getWithdrawals);
router.post('/track-click', auth, nudgeCashController.trackClick);
router.post('/withdraw', auth, nudgeCashController.requestWithdrawal);

// Webhook/callback endpoint (for affiliate networks to report purchases)
router.post('/record-cashback', async (req, res, next) => {
  const apiKey = req.headers['x-webhook-key'];
  if (apiKey !== process.env.CASHBACK_WEBHOOK_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, nudgeCashController.recordCashback);

// Admin endpoint to confirm pending transactions
router.post('/confirm/:transactionId', async (req, res, next) => {
  const apiKey = req.headers['x-webhook-key'];
  if (apiKey !== process.env.CASHBACK_WEBHOOK_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, nudgeCashController.confirmTransaction);

export default router;
