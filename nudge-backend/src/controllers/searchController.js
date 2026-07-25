import { pool } from '../config/database.js';
import { fetchSearchResults, calculateRelevanceScore, checkWinningCombination } from '../config/searchApis.js';
import logger from '../utils/logger.js';

const searchController = {
  async performSearch(req, res) {
    const { query } = req.body;
    const userId = req.userId || null;
    try {
      if (!query || query.trim().length === 0) return res.status(400).json({ error: 'Search query is required' });
      const allResults = await fetchSearchResults(query);
      if (allResults.length === 0) return res.status(404).json({ error: 'No results found' });
      const reels = [[], [], []];
      allResults.forEach((result, index) => { reels[index % 3].push(result); });
      const relevanceRating = calculateRelevanceScore(allResults);
      const isWinning = checkWinningCombination(reels);
      if (userId) {
        await pool.query('INSERT INTO search_history (user_id, query, result_count, is_winning) VALUES ($1, $2, $3, $4)', [userId, query, allResults.length, isWinning]);
      }
      res.json({ query, reels, totalResults: allResults.length, isWinning, relevanceRating });
    } catch (error) {
      logger.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  async getSearchHistory(req, res) {
    try {
      const result = await pool.query('SELECT query, result_count, is_winning, created_at FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.userId]);
      res.json(result.rows);
    } catch (error) {
      logger.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  },
};

export default searchController;
