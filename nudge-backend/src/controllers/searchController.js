import { pool } from '../config/database.js';
import { fetchSearchResults, calculateRelevanceScore, checkWinningCombination, enhanceQuery, searchGoogleNewsRSS } from '../config/searchApis.js';
import { wrapWithAffiliate, isAffiliateEligible } from '../config/affiliateLinks.js';
import sportsService from '../config/sportsService.js';
import { getCached, setCached, makeCacheKey } from '../middleware/searchCache.js';
// Note: trending is also cached via the same cache utility
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
      
      // Check cache first — skip for authenticated users to keep streaks accurate
      const cacheKey = makeCacheKey(enhancedQuery, keywords, counts);
      const cached = getCached(cacheKey);
      if (cached && !userId) {
        // Return cached results for anonymous users (streak tracking skipped)
        return res.json(cached);
      }

      const categorizedResults = await fetchSearchResults(enhancedQuery, { resultCounts: counts });

      const totalResults = Object.values(categorizedResults).reduce(
        (sum, arr) => sum + arr.length, 0
      );

      if (totalResults === 0) {
        return res.status(404).json({ error: 'No results found' });
      }

      // Wrap Shopping reel results with affiliate links + cashback info
      if (categorizedResults.shopping && categorizedResults.shopping.length > 0) {
        categorizedResults.shopping = categorizedResults.shopping.map(result => {
          const affiliate = wrapWithAffiliate(result.url, query);
          return {
            ...result,
            affiliateUrl: affiliate.affiliateUrl,
            cashbackRate: affiliate.cashbackRate,
            merchant: affiliate.merchant,
            isAffiliateEligible: isAffiliateEligible(result.url),
          };
        });
      }

      const isWinning = checkWinningCombination(categorizedResults);
      const relevanceRating = calculateRelevanceScore(categorizedResults);

      // Detect sports queries and fetch relevant sports data
      let sportsData = null;
      const sportsMatch = sportsService.detectSportsQuery(query);
      if (sportsMatch) {
        // Cache sports data separately (longer TTL — 5 min)
        const sportsCacheKey = `sports:${query}`;
        const cachedSports = getCached(sportsCacheKey);
        if (cachedSports) {
          sportsData = cachedSports;
        } else {
          try {
            const leagueData = await Promise.all(
              sportsMatch.suggestedLeagues.map(async (leagueId) => {
                const [upcoming, recent] = await Promise.all([
                  sportsService.getNextLeagueEvents(leagueId),
                  sportsService.getPastLeagueEvents(leagueId),
                ]);
                const details = await sportsService.getLeagueDetails(leagueId);
                return {
                  league: details?.strLeague || `League ${leagueId}`,
                  leagueId,
                  upcoming: upcoming.slice(0, 3),
                  recent: recent.slice(0, 3),
                };
              })
            );
            sportsData = {
              matched: true,
              type: sportsMatch.type,
              query: sportsMatch.query,
              leagues: leagueData,
            };
            setCached(sportsCacheKey, sportsData, 300_000); // 5 min cache
          } catch (err) {
            logger.warn('Sports data fetch failed for query:', query, err.message);
          }
        }
      }

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

      const response = {
        query,
        enhancedQuery: enhancedQuery !== query ? enhancedQuery : undefined,
        reels: categorizedResults,
        totalResults,
        isWinning,
        relevanceRating,
        streakInfo,
        sportsData,
      };

      // Cache the response for anonymous users (60s TTL)
      if (!userId) {
        setCached(cacheKey, response);
      }

      res.json(response);
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
      // Check cache first (5 min TTL)
      const cachedTrending = getCached('trending_searches');
      if (cachedTrending) return res.json(cachedTrending);

      const result = await pool.query(
        `SELECT query, COUNT(*) as search_count
         FROM search_history
         WHERE created_at > NOW() - INTERVAL '24 hours'
         GROUP BY query
         ORDER BY search_count DESC
         LIMIT 10`
      );

      if (result.rows.length === 0) {
        return res.json([
          { query: 'latest AI news', search_count: 0 },
          { query: 'best laptops 2026', search_count: 0 },
          { query: 'travel destinations', search_count: 0 },
          { query: 'healthy recipes', search_count: 0 },
          { query: 'space exploration', search_count: 0 },
        ]);
      }

      setCached('trending_searches', result.rows, 300_000); // 5 min cache
      res.json(result.rows);
    } catch (error) {
      logger.error('Trending fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch trending searches' });
    }
  },

  async getTrendingNews(req, res) {
    try {
      // Check cache first (10 min TTL for news)
      const cachedNews = getCached('trending_news');
      if (cachedNews) return res.json(cachedNews);

      // Fetch trending headlines from multiple categories (all free, no API key)
      const [worldNews, techNews, businessNews] = await Promise.all([
        searchGoogleNewsRSS('world news today', 5),
        searchGoogleNewsRSS('technology news', 4),
        searchGoogleNewsRSS('business and finance news', 3),
      ]);
      
      // Combine and deduplicate across categories
      const combined = [...worldNews, ...techNews, ...businessNews];
      const seen = new Set();
      const deduped = combined.filter(item => {
        if (seen.has(item.title) || !item.title || item.title.length < 15) return false;
        // Filter out local TV news broadcasts
        if (/\b\d+\s*(p|a)\.?m\.?\b/i.test(item.title) && /news at|top stories|evening news|morning news/i.test(item.title)) return false;
        seen.add(item.title);
        return true;
      }).slice(0, 12);
      
      setCached('trending_news', deduped, 600_000); // 10 min cache
      res.json(deduped);
    } catch (error) {
      logger.error('Trending news fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch trending news' });
    }
  }

};

export default searchController;
