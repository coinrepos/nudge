import sportsService from '../config/sportsService.js';
import logger from '../utils/logger.js';

const sportsController = {
  /**
   * GET /api/sports/dashboard
   * Combined view: today's events, upcoming fixtures, recent results for popular leagues
   */
  async getDashboard(req, res) {
    try {
      const dashboard = await sportsService.getSportsDashboard();
      res.json(dashboard);
    } catch (error) {
      logger.error('Sports dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch sports data' });
    }
  },

  /**
   * GET /api/sports/today
   * All events happening today
   */
  async getTodayEvents(req, res) {
    try {
      const events = await sportsService.getTodayEvents();
      res.json({ events, date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      logger.error('Today events error:', error);
      res.status(500).json({ error: 'Failed to fetch today events' });
    }
  },

  /**
   * GET /api/sports/date/:date
   * Events for a specific date (YYYY-MM-DD)
   */
  async getEventsByDate(req, res) {
    try {
      const { date } = req.params;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      const events = await sportsService.getEventsByDate(date);
      res.json({ events, date });
    } catch (error) {
      logger.error('Date events error:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  },

  /**
   * GET /api/sports/league/:leagueId/upcoming
   * Next upcoming events for a league
   */
  async getUpcomingEvents(req, res) {
    try {
      const { leagueId } = req.params;
      const events = await sportsService.getNextLeagueEvents(leagueId);
      res.json({ events, leagueId });
    } catch (error) {
      logger.error('Upcoming events error:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming events' });
    }
  },

  /**
   * GET /api/sports/league/:leagueId/results
   * Recent past results for a league
   */
  async getPastResults(req, res) {
    try {
      const { leagueId } = req.params;
      const events = await sportsService.getPastLeagueEvents(leagueId);
      res.json({ events, leagueId });
    } catch (error) {
      logger.error('Past results error:', error);
      res.status(500).json({ error: 'Failed to fetch past results' });
    }
  },

  /**
   * GET /api/sports/league/:leagueId/standings
   * League standings/table
   */
  async getStandings(req, res) {
    try {
      const { leagueId } = req.params;
      const { season } = req.query;
      const table = await sportsService.getLeagueTable(leagueId, season);
      res.json({ table, leagueId, season: season || 'current' });
    } catch (error) {
      logger.error('Standings error:', error);
      res.status(500).json({ error: 'Failed to fetch standings' });
    }
  },

  /**
   * GET /api/sports/leagues
   * All available leagues
   */
  async getLeagues(req, res) {
    try {
      const leagues = await sportsService.getAllLeagues();
      res.json({ leagues });
    } catch (error) {
      logger.error('Leagues error:', error);
      res.status(500).json({ error: 'Failed to fetch leagues' });
    }
  },

  /**
   * GET /api/sports/team/:teamId
   * Team details + next events
   */
  async getTeamDetails(req, res) {
    try {
      const { teamId } = req.params;
      const [team, events] = await Promise.all([
        sportsService.getTeamDetails(teamId),
        sportsService.getNextTeamEvents(teamId),
      ]);
      res.json({ team, events });
    } catch (error) {
      logger.error('Team details error:', error);
      res.status(500).json({ error: 'Failed to fetch team details' });
    }
  },

  /**
   * GET /api/sports/detect?query=...
   * Detect if a query is sports-related and return relevant league suggestions
   */
  async detectSportsQuery(req, res) {
    try {
      const { query } = req.query;
      const result = sportsService.detectSportsQuery(query);
      res.json(result || { matched: false });
    } catch (error) {
      logger.error('Sports query detection error:', error);
      res.status(500).json({ error: 'Failed to detect sports query' });
    }
  },
};

export default sportsController;
