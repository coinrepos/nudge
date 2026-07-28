import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const nudgeCashController = {
  // Get user's Nudge Cash balance
  async getBalance(req, res) {
    try {
      let result = await pool.query(
        'SELECT balance, pending_balance, total_earned FROM nudge_cash WHERE user_id = $1',
        [req.userId]
      );

      // Auto-create balance row if it doesn't exist
      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO nudge_cash (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
          [req.userId]
        );
        result = await pool.query(
          'SELECT balance, pending_balance, total_earned FROM nudge_cash WHERE user_id = $1',
          [req.userId]
        );
      }

      const row = result.rows[0] || { balance: 0, pending_balance: 0, total_earned: 0 };
      res.json({
        balance: parseFloat(row.balance) || 0,
        pendingBalance: parseFloat(row.pending_balance) || 0,
        totalEarned: parseFloat(row.total_earned) || 0,
      });
    } catch (error) {
      logger.error('Nudge Cash balance error:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  },

  // Get cashback transaction history
  async getTransactions(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, amount, merchant, product_title, order_id, status,
                cashback_rate, original_purchase_amount, search_query,
                created_at, confirmed_at
         FROM cashback_transactions
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.userId]
      );

      res.json(result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount) || 0,
        cashbackRate: parseFloat(row.cashback_rate) || 0,
        originalPurchaseAmount: parseFloat(row.original_purchase_amount) || 0,
      })));
    } catch (error) {
      logger.error('Nudge Cash transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  },

  // Track an affiliate click
  async trackClick(req, res) {
    try {
      const { originalUrl, affiliateUrl, merchant, searchQuery } = req.body;

      if (!originalUrl || !affiliateUrl) {
        return res.status(400).json({ error: 'Missing URL data' });
      }

      await pool.query(
        `INSERT INTO affiliate_clicks (user_id, original_url, affiliate_url, merchant, search_query)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.userId, originalUrl, affiliateUrl, merchant || null, searchQuery || null]
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Affiliate click tracking error:', error);
      res.status(500).json({ error: 'Failed to track click' });
    }
  },

  // Get Nudge Cash stats (overview)
  async getStats(req, res) {
    try {
      const [balanceResult, clickResult, txResult, pendingResult] = await Promise.all([
        pool.query('SELECT balance, pending_balance, total_earned FROM nudge_cash WHERE user_id = $1', [req.userId]),
        pool.query('SELECT COUNT(*) as count FROM affiliate_clicks WHERE user_id = $1', [req.userId]),
        pool.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM cashback_transactions WHERE user_id = $1', [req.userId]),
        pool.query('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM cashback_transactions WHERE user_id = $1 AND status = $2', [req.userId, 'pending']),
      ]);

      res.json({
        balance: parseFloat(balanceResult.rows[0]?.balance) || 0,
        pendingBalance: parseFloat(balanceResult.rows[0]?.pending_balance) || 0,
        totalEarned: parseFloat(balanceResult.rows[0]?.total_earned) || 0,
        totalClicks: parseInt(clickResult.rows[0]?.count) || 0,
        totalTransactions: parseInt(txResult.rows[0]?.count) || 0,
        totalCashbackAll: parseFloat(txResult.rows[0]?.total) || 0,
        pendingTransactions: parseInt(pendingResult.rows[0]?.count) || 0,
        pendingAmount: parseFloat(pendingResult.rows[0]?.total) || 0,
      });
    } catch (error) {
      logger.error('Nudge Cash stats error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },

  // Get affiliate click history (for analytics)
  async getClickHistory(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, original_url, affiliate_url, merchant, search_query, clicked_at
         FROM affiliate_clicks
         WHERE user_id = $1
         ORDER BY clicked_at DESC
         LIMIT 50`,
        [req.userId]
      );
      res.json(result.rows);
    } catch (error) {
      logger.error('Click history error:', error);
      res.status(500).json({ error: 'Failed to fetch click history' });
    }
  },

  // Admin/Callback: Record a cashback transaction (called by affiliate network webhook or manual entry)
  async recordCashback(req, res) {
    try {
      const { userId, amount, merchant, productTitle, orderId, cashbackRate, originalPurchaseAmount, searchQuery, status } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Insert transaction
      const txResult = await pool.query(
        `INSERT INTO cashback_transactions
         (user_id, amount, merchant, product_title, order_id, cashback_rate, original_purchase_amount, search_query, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [userId, amount, merchant, productTitle, orderId, cashbackRate, originalPurchaseAmount, searchQuery, status || 'pending']
      );

      const transactionId = txResult.rows[0].id;

      // If status is confirmed, update the balance immediately
      if (status === 'confirmed') {
        await pool.query(
          `INSERT INTO nudge_cash (user_id, balance, total_earned)
           VALUES ($1, $2, $2)
           ON CONFLICT (user_id)
           DO UPDATE SET
             balance = nudge_cash.balance + $2,
             total_earned = nudge_cash.total_earned + $2,
             pending_balance = GREATEST(nudge_cash.pending_balance - $2, 0),
             updated_at = NOW()`,
          [userId, amount]
        );

        await pool.query(
          'UPDATE cashback_transactions SET confirmed_at = NOW() WHERE id = $1',
          [transactionId]
        );
      } else {
        // Pending — add to pending balance
        await pool.query(
          `INSERT INTO nudge_cash (user_id, pending_balance)
           VALUES ($1, $2)
           ON CONFLICT (user_id)
           DO UPDATE SET
             pending_balance = nudge_cash.pending_balance + $2,
             updated_at = NOW()`,
          [userId, amount]
        );
      }

      // Log in generic reward system too
      const rewardTypeResult = await pool.query(
        "SELECT id FROM reward_types WHERE type_key = 'nudge_cash'"
      );
      if (rewardTypeResult.rows.length > 0) {
        const rewardTypeId = rewardTypeResult.rows[0].id;
        await pool.query(
          `INSERT INTO reward_transactions (user_id, reward_type_id, amount, source, description, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, rewardTypeId, amount, 'cashback', `Cashback from ${merchant}`, JSON.stringify({ transactionId, orderId })]
        );

        await pool.query(
          `INSERT INTO user_rewards (user_id, reward_type_id, balance, total_earned)
           VALUES ($1, $2, $3, $3)
           ON CONFLICT (user_id, reward_type_id)
           DO UPDATE SET
             balance = user_rewards.balance + $3,
             total_earned = user_rewards.total_earned + $3,
             updated_at = NOW()`,
          [userId, rewardTypeId, amount]
        );
      }

      res.json({ success: true, transactionId });
    } catch (error) {
      logger.error('Record cashback error:', error);
      res.status(500).json({ error: 'Failed to record cashback' });
    }
  },

  // Confirm a pending transaction (move from pending to balance)
  async confirmTransaction(req, res) {
    try {
      const { transactionId } = req.params;

      const txResult = await pool.query(
        'SELECT user_id, amount, status FROM cashback_transactions WHERE id = $1',
        [transactionId]
      );

      if (txResult.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const tx = txResult.rows[0];
      if (tx.status !== 'pending') {
        return res.status(400).json({ error: 'Transaction is not pending' });
      }

      // Move from pending to confirmed
      await pool.query(
        `UPDATE nudge_cash
         SET balance = balance + $2,
             pending_balance = GREATEST(pending_balance - $2, 0),
             total_earned = total_earned + $2,
             updated_at = NOW()
         WHERE user_id = $1`,
        [tx.user_id, tx.amount]
      );

      await pool.query(
        'UPDATE cashback_transactions SET status = $1, confirmed_at = NOW() WHERE id = $2',
        ['confirmed', transactionId]
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Confirm transaction error:', error);
      res.status(500).json({ error: 'Failed to confirm transaction' });
    }
  },
};

export default nudgeCashController;
