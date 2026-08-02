import express from 'express';
import sportsController from '../controllers/sportsController.js';

const router = express.Router();

// Public routes (no auth required — sports data is public)
router.get('/dashboard', sportsController.getDashboard);
router.get('/today', sportsController.getTodayEvents);
router.get('/date/:date', sportsController.getEventsByDate);
router.get('/leagues', sportsController.getLeagues);
router.get('/league/:leagueId/upcoming', sportsController.getUpcomingEvents);
router.get('/league/:leagueId/results', sportsController.getPastResults);
router.get('/league/:leagueId/standings', sportsController.getStandings);
router.get('/team/:teamId', sportsController.getTeamDetails);
router.get('/detect', sportsController.detectSportsQuery);

export default router;
