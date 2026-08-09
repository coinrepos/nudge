import express from 'express';
import nudgeCashController from '../controllers/nudgeCashController.js';
import { syncAwinProgrammes, getConfiguredMerchants, getSyncStatus } from '../config/affiliateLinks.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// User endpoints (require auth)
router.get('/balance', auth, nudgeCashController.getBalance);
router.get('/transactions', auth, nudgeCashController.getTransactions);
router.get('/stats', auth, nudgeCashController.getStats);
router.get('/clicks', auth, nudgeCashController.getClickHistory);
router.get('/withdrawals', auth, nudgeCashController.getWithdrawals);
router.post('/track-click', auth, nudgeCashController.trackClick);
router.post('/withdraw', auth, nudgeCashController.requestWithdrawal);

// Affiliate merchant sync & status
router.get('/merchants', auth, async (req, res) => {
  try {
    const merchants = getConfiguredMerchants();
    res.json({ merchants, count: merchants.length, syncStatus: getSyncStatus() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

router.post('/sync-merchants', auth, async (req, res) => {
  try {
    await syncAwinProgrammes();
    const merchants = getConfiguredMerchants();
    res.json({ success: true, count: merchants.length, syncStatus: getSyncStatus() });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed: ' + err.message });
  }
});

router.get('/sync-status', auth, (req, res) => {
  res.json(getSyncStatus());
});

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
