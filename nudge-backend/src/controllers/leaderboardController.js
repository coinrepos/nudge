import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const leaderboardController = {
  async getTopUsers(req, res) {
    try {
      const result = await pool.query(
        `SELECT username, social_credits, (SELECT COUNT(*) FROM spin_history sh WHERE sh.user_id = users.id) as total_spins, (SELECT COUNT(*) FROM spin_history sh WHERE sh.user_id = users.id AND sh.is_winning) as winning_spins FROM users ORDER BY social_credits DESC LIMIT 100`
      );
      res.json(result.rows);
    } catch (error) {
      logger.error('Leaderboard fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  },

  async getUserRank(req, res) {
    const { userId } = req.params;
    try {
      const rankResult = await pool.query(`SELECT RANK() OVER (ORDER BY social_credits DESC) as rank FROM users WHERE id = $1`, [userId]);
      if (rankResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ rank: rankResult.rows[0].rank });
    } catch (error) {
      logger.error('Rank fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch rank' });
    }
  },
};

export default leaderboardController;
