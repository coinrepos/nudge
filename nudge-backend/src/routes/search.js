import express from 'express';
import searchController from '../controllers/searchController.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/query', optionalAuth, searchController.performSearch);
router.get('/history', auth, searchController.getSearchHistory);
router.get('/trending', searchController.getTrendingSearches);
router.get('/trending-news', searchController.getTrendingNews);

export default router;
