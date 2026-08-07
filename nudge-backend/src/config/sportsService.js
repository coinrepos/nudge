/**
 * TheSportsDB API Service
 * Free API key: 123 (30 req/min limit)
 * Premium: replace with user's premium key for full access
 * Docs: https://www.thesportsdb.com/documentation
 */

import logger from '../utils/logger.js';

// Fetch with timeout — prevents hangs on slow API responses
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

const API_KEY = process.env.THESPORTSDB_KEY || '123';
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// Major league IDs (commonly referenced)
const LEAGUE_IDS = {
  epl: 4328,        // English Premier League
  championship: 4329, // English Championship
  bundesliga: 4331,   // German Bundesliga
  serieA: 4332,       // Italian Serie A
  ligue1: 4334,      // French Ligue 1
  laLiga: 4335,      // Spanish La Liga
  eredivisie: 4337,   // Dutch Eredivisie
  nba: 4387,
  nfl: 4391,
  mlb: 4424,
  nhl: 4380,
  formula1: 4370,
  ufc: 4443,
};

// Popular leagues for the default view
const POPULAR_LEAGUES = [
  { id: 4328, name: 'English Premier League', sport: 'Soccer', country: 'England' },
  { id: 4331, name: 'German Bundesliga', sport: 'Soccer', country: 'Germany' },
  { id: 4332, name: 'Italian Serie A', sport: 'Soccer', country: 'Italy' },
  { id: 4335, name: 'Spanish La Liga', sport: 'Soccer', country: 'Spain' },
  { id: 4334, name: 'French Ligue 1', sport: 'Soccer', country: 'France' },
  { id: 4387, name: 'NBA', sport: 'Basketball', country: 'USA' },
  { id: 4391, name: 'NFL', sport: 'American Football', country: 'USA' },
  { id: 4380, name: 'NHL', sport: 'Ice Hockey', country: 'USA' },
  { id: 4424, name: 'MLB', sport: 'Baseball', country: 'USA' },
  { id: 4370, name: 'Formula 1', sport: 'Motorsport', country: 'International' },
];

const sportsService = {
  /**
   * Get all available sports
   */
  async getAllSports() {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/all_sports.php`);
      return data.sports || [];
    } catch (err) {
      logger.error('SportsDB: Failed to fetch sports:', err.message);
      return [];
    }
  },

  /**
   * Get all available leagues
   */
  async getAllLeagues() {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/all_leagues.php`);
      return data.leagues || [];
    } catch (err) {
      logger.error('SportsDB: Failed to fetch leagues:', err.message);
      return [];
    }
  },

  /**
   * Get today's events across all sports
   */
  async getTodayEvents() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await fetchWithTimeout(`${BASE_URL}/eventsday.php?d=${today}&s=All_Sports`);
      return (data.events || []).map(e => this._formatEvent(e));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch today events:', err.message);
      return [];
    }
  },

  /**
   * Get events for a specific date
   */
  async getEventsByDate(date) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/eventsday.php?d=${date}&s=All_Sports`);
      return (data.events || []).map(e => this._formatEvent(e));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch date events:', err.message);
      return [];
    }
  },

  /**
   * Get next upcoming events for a league
   */
  async getNextLeagueEvents(leagueId) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/eventsnextleague.php?id=${leagueId}`);
      return (data.events || []).map(e => this._formatEvent(e));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch next league events:', err.message);
      return [];
    }
  },

  /**
   * Get past events for a league (recent results)
   */
  async getPastLeagueEvents(leagueId) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/eventspastleague.php?id=${leagueId}`);
      return (data.events || []).map(e => this._formatEvent(e));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch past league events:', err.message);
      return [];
    }
  },

  /**
   * Get league standings/table
   */
  async getLeagueTable(leagueId, season = null) {
    try {
      let url = `${BASE_URL}/lookuptable.php?l=${leagueId}`;
      if (season) url += `&s=${season}`;
      const data = await fetchWithTimeout(url);
      return (data.table || []).map(t => ({
        rank: parseInt(t.intRank) || 0,
        team: t.strTeam,
        teamId: t.idTeam,
        played: parseInt(t.intPlayed) || 0,
        win: parseInt(t.intWin) || 0,
        draw: parseInt(t.intDraw) || 0,
        loss: parseInt(t.intLoss) || 0,
        goalsFor: parseInt(t.intGoalsFor) || 0,
        goalsAgainst: parseInt(t.intGoalsAgainst) || 0,
        goalDiff: parseInt(t.intGoalDifference) || 0,
        points: parseInt(t.intPoints) || 0,
        form: t.strForm || null,
        badge: t.strBadge || null,
      }));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch league table:', err.message);
      return [];
    }
  },

  /**
   * Get league details
   */
  async getLeagueDetails(leagueId) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/lookupleague.php?id=${leagueId}`);
      return (data.leagues && data.leagues[0]) || null;
    } catch (err) {
      logger.error('SportsDB: Failed to fetch league details:', err.message);
      return null;
    }
  },

  /**
   * Get team details
   */
  async getTeamDetails(teamId) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/lookupteam.php?id=${teamId}`);
      return (data.teams && data.teams[0]) || null;
    } catch (err) {
      logger.error('SportsDB: Failed to fetch team details:', err.message);
      return null;
    }
  },

  /**
   * Get next 5 events for a specific team
   */
  async getNextTeamEvents(teamId) {
    try {
      const data = await fetchWithTimeout(`${BASE_URL}/eventsnextteam.php?id=${teamId}`);
      return (data.events || []).map(e => this._formatEvent(e));
    } catch (err) {
      logger.error('SportsDB: Failed to fetch team events:', err.message);
      return [];
    }
  },

  /**
   * Get a combined "sports dashboard" for the homepage
   * Returns today's events, upcoming fixtures for popular leagues, and recent results
   */
  async getSportsDashboard() {
    try {
      const todayEvents = await this.getTodayEvents();

      // Fetch upcoming + past for top leagues in parallel
      const leagueDataPromises = POPULAR_LEAGUES.map(async (league) => {
        const [upcoming, past] = await Promise.all([
          this.getNextLeagueEvents(league.id),
          this.getPastLeagueEvents(league.id),
        ]);
        return {
          league: league.name,
          leagueId: league.id,
          sport: league.sport,
          country: league.country,
          upcoming: upcoming.slice(0, 3),
          recent: past.slice(0, 3),
        };
      });

      const leagueData = await Promise.all(leagueDataPromises);

      return {
        todayEvents,
        leagues: leagueData,
        popularLeagues: POPULAR_LEAGUES,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('SportsDB: Failed to build dashboard:', err.message);
      return { todayEvents: [], leagues: [], popularLeagues: POPULAR_LEAGUES, timestamp: new Date().toISOString() };
    }
  },

  /**
   * Detect if a search query is sports-related
   * Returns a sport context if matched, null otherwise
   */
  detectSportsQuery(query) {
    if (!query) return null;
    const q = query.toLowerCase().trim();

    // Check for team names
    const teamKeywords = [
      'arsenal', 'chelsea', 'liverpool', 'manchester', 'city', 'united', 'tottenham',
      'barcelona', 'real madrid', 'bayern', 'juventus', 'psg', 'psg', 'atletico',
      'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nets',
      'chiefs', 'patriots', 'packers', 'cowboys', 'eagles', '49ers',
      'rangers', 'bruins', 'maple leafs', 'penguins', 'blackhawks',
      'yankees', 'red sox', 'dodgers', 'astros', 'braves',
      'all blacks', 'crusaders', 'hurricanes', 'blues', 'highlanders',
      'ferrari', 'mercedes', 'red bull', 'mclaren', 'aston martin',
    ];

    // Check for sport names
    const sportKeywords = [
      'football', 'soccer', 'basketball', 'nba', 'nfl', 'baseball', 'mlb',
      'hockey', 'nhl', 'rugby', 'cricket', 'tennis', 'golf', 'f1', 'formula 1',
      'boxing', 'ufc', 'mma', 'premier league', 'la liga', 'bundesliga',
      'serie a', 'champions league', 'world cup', 'euro', 'super bowl',
      'playoff', 'finals', 'match', 'score', 'fixture', 'standing', 'table',
      'sports', 'game', 'tournament', 'league',
    ];

    const isTeam = teamKeywords.some(t => q.includes(t));
    const isSport = sportKeywords.some(s => q.includes(s));

    if (isTeam || isSport) {
      return {
        type: isTeam ? 'team' : 'sport',
        query: q,
        suggestedLeagues: this._suggestLeagues(q),
      };
    }

    return null;
  },

  /**
   * Suggest relevant leagues based on query keywords
   */
  _suggestLeagues(query) {
    const q = query.toLowerCase();
    const suggestions = [];

    if (q.includes('premier league') || q.includes('epl') || q.includes('england') || 
        q.includes('arsenal') || q.includes('chelsea') || q.includes('liverpool') ||
        q.includes('manchester') || q.includes('tottenham') || q.includes('newcastle')) {
      suggestions.push(4328); // EPL
    }
    if (q.includes('la liga') || q.includes('spain') || q.includes('barcelona') || q.includes('real madrid')) {
      suggestions.push(4335); // La Liga
    }
    if (q.includes('bundesliga') || q.includes('germany') || q.includes('bayern')) {
      suggestions.push(4331); // Bundesliga
    }
    if (q.includes('serie a') || q.includes('italy') || q.includes('juventus')) {
      suggestions.push(4332); // Serie A
    }
    if (q.includes('ligue 1') || q.includes('france') || q.includes('psg')) {
      suggestions.push(4334); // Ligue 1
    }
    if (q.includes('nba') || q.includes('basketball') || q.includes('lakers') || q.includes('celtics')) {
      suggestions.push(4387); // NBA
    }
    if (q.includes('nfl') || q.includes('football') && !q.includes('soccer') || q.includes('super bowl') || q.includes('chiefs')) {
      suggestions.push(4391); // NFL
    }
    if (q.includes('f1') || q.includes('formula 1') || q.includes('racing') || q.includes('ferrari')) {
      suggestions.push(4370); // F1
    }
    if (q.includes('nhl') || q.includes('hockey') || q.includes('rangers')) {
      suggestions.push(4380); // NHL
    }
    if (q.includes('all blacks') || q.includes('rugby') || q.includes('new zealand')) {
      suggestions.push(4328); // Default to EPL as placeholder (rugby league IDs vary)
    }

    // Default: show EPL if nothing matched but it's clearly sports
    if (suggestions.length === 0) {
      suggestions.push(4328, 4387, 4391); // EPL, NBA, NFL
    }

    return [...new Set(suggestions)].slice(0, 3);
  },

  /**
   * Format a raw event into a clean object
   */
  _formatEvent(e) {
    const homeScore = e.intHomeScore !== null ? e.intHomeScore : null;
    const awayScore = e.intAwayScore !== null ? e.intAwayScore : null;
    const hasResult = homeScore !== null && awayScore !== null;

    return {
      id: e.idEvent,
      event: e.strEvent,
      sport: e.strSport,
      league: e.strLeague,
      leagueId: e.idLeague,
      round: e.strRound || null,
      date: e.dateEvent,
      time: e.strTime || null,
      timestamp: e.strTimestamp || null,
      homeTeam: e.strHomeTeam,
      awayTeam: e.strAwayTeam,
      homeTeamId: e.idHomeTeam,
      awayTeamId: e.idAwayTeam,
      homeScore,
      awayScore,
      hasResult,
      score: hasResult ? `${homeScore} - ${awayScore}` : 'vs',
      venue: e.strVenue || null,
      country: e.strCountry || null,
      poster: e.strPoster || null,
      thumb: e.strThumb || null,
      banner: e.strBanner || null,
      video: e.strVideo || null,
      status: this._getEventStatus(e),
    };
  },

  /**
   * Determine event status: upcoming, live, finished
   */
  _getEventStatus(e) {
    if (e.intHomeScore !== null && e.intAwayScore !== null && e.strPostponed !== 'yes') {
      return 'finished';
    }
    if (e.strPostponed === 'yes') return 'postponed';
    if (e.strTimestamp) {
      const eventTime = new Date(e.strTimestamp + 'Z');
      const now = new Date();
      const diffHours = (eventTime - now) / (1000 * 60 * 60);
      if (diffHours < 0 && diffHours > -3) return 'live';
      if (diffHours > 0) return 'upcoming';
    }
    return 'upcoming';
  },

  // Export league IDs for use elsewhere
  LEAGUE_IDS,
  POPULAR_LEAGUES,
};

export default sportsService;
