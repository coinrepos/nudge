import { pool } from '../config/database.js';
import { fetchSearchResults, calculateRelevanceScore, checkWinningCombination, enhanceQuery } from '../config/searchApis.js';
import logger from '../utils/logger.js';

const DEFAULT_RESULT_COUNTS = { all: 50, images: 10, videos: 25, news: 15, shopping: 15 };

const searchController = {
  async performSearch(req, res) {
    const { query, keywords, resultCounts } = req.body;
    const userId = req.userId || null;

    try {
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const enhancedQuery = keywords && keywords.length > 0
        ? enhanceQuery(query, keywords)
        : query;

      const counts = { ...DEFAULT_RESULT_COUNTS, ...(resultCounts || {}) };
      const categorizedResults = await fetchSearchResults(enhancedQuery, { resultCounts: counts });

      const totalResults = Object.values(categorizedResults).reduce(
        (sum, arr) => sum + arr.length, 0
      );

      if (totalResults === 0) {
        return res.status(404).json({ error: 'No results found' });
      }

      const isWinning = checkWinningCombination(categorizedResults);
      const relevanceRating = calculateRelevanceScore(categorizedResults);

      let streakInfo = null;

      if (userId) {
        await pool.query(
          'INSERT INTO search_history (user_id, query, result_count, is_winning) VALUES ($1, $2, $3, $4)',
          [userId, query, totalResults, isWinning]
        );

        // Update daily streak
        const today = new Date().toISOString().split('T')[0];
        const userResult = await pool.query(
          'SELECT last_search_date, streak_count FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length > 0) {
          const lastDate = userResult.rows[0].last_search_date;
          const currentStreak = userResult.rows[0].streak_count || 0;
          let newStreak = 1;

          if (lastDate) {
            const last = new Date(lastDate);
            const now = new Date(today);
            const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              newStreak = currentStreak + 1;
            } else if (diffDays === 0) {
              newStreak = currentStreak || 1;
            }
          }

          await pool.query(
            'UPDATE users SET last_search_date = $1, streak_count = $2 WHERE id = $3',
            [today, newStreak, userId]
          );

          streakInfo = { streak: newStreak, bonus: newStreak >= 7 ? (newStreak >= 30 ? 2 : 1) : 0 };
        }
      }

      res.json({
        query,
        enhancedQuery: enhancedQuery !== query ? enhancedQuery : undefined,
        reels: categorizedResults,
        totalResults,
        isWinning,
        relevanceRating,
        streakInfo,
      });
    } catch (error) {
      logger.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  },

  async getSearchHistory(req, res) {
    try {
      const result = await pool.query(
        'SELECT query, result_count, is_winning, created_at FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [req.userId]
      );
      res.json(result.rows);
    } catch (error) {
      logger.error('History fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  },

  async getTrendingSearches(req, res) {
    try {
      const result = await pool.query(
        `SELECT query, COUNT(*) as search_count
         FROM search_history
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY query
         ORDER BY search_count DESC
         LIMIT 10`
      );

      if (result.rows.length === 0) {
        // Fallback: return some default trending queries
        return res.json([
          { query: 'latest AI news', search_count: 0 },
          { query: 'best laptops 2026', search_count: 0 },
          { query: 'travel destinations', search_count: 0 },
          { query: 'healthy recipes', search_count: 0 },
          { query: 'space exploration', search_count: 0 },
        ]);
      }

      res.json(result.rows);
    } catch (error) {
      logger.error('Trending fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch trending searches' });
    }
  },
};

export default searchController;
