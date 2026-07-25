import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const creditController = {
  async recordSpin(req, res) {
    const { isWinning } = req.body;
    const userId = req.userId || null;
    try {
      let creditsEarned = 1;
      if (isWinning) creditsEarned += 2;
      if (userId) {
        await pool.query('UPDATE users SET social_credits = social_credits + $1 WHERE id = $2', [creditsEarned, userId]);
        await pool.query('INSERT INTO spin_history (user_id, credits_earned, is_winning) VALUES ($1, $2, $3)', [userId, creditsEarned, isWinning]);
        const result = await pool.query('SELECT social_credits FROM users WHERE id = $1', [userId]);
        const io = req.app.get('io');
        io.emit('creditUpdate', { userId, newBalance: result.rows[0].social_credits, creditsEarned });
        res.json({ creditsEarned, newBalance: result.rows[0].social_credits, isWinning });
      } else {
        res.json({ creditsEarned, isWinning, message: 'Sign up to save your credits!' });
      }
    } catch (error) {
      logger.error('Spin record error:', error);
      res.status(500).json({ error: 'Failed to record spin' });
    }
  },

  async getBalance(req, res) {
    try {
      const result = await pool.query('SELECT social_credits FROM users WHERE id = $1', [req.userId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ balance: result.rows[0].social_credits });
    } catch (error) {
      logger.error('Balance fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  },

  async getStats(req, res) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as total_spins, SUM(credits_earned) as total_credits, COUNT(*) FILTER (WHERE is_winning) as winning_spins FROM spin_history WHERE user_id = $1`,
        [req.userId]
      );
      const stats = result.rows[0];
      res.json({
        totalSpins: parseInt(stats.total_spins) || 0,
        totalCredits: parseInt(stats.total_credits) || 0,
        winningSpins: parseInt(stats.winning_spins) || 0,
        winRate: stats.total_spins > 0 ? ((parseInt(stats.winning_spins) / parseInt(stats.total_spins)) * 100).toFixed(2) : 0,
      });
    } catch (error) {
      logger.error('Stats fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },
};

export default creditController;
