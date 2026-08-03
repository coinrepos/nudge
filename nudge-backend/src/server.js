import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import creditRoutes from './routes/credits.js';
import leaderboardRoutes from './routes/leaderboard.js';
import nudgeCashRoutes from './routes/nudgeCash.js';
import sportsRoutes from './routes/sports.js';
import { errorHandler } from './middleware/errorHandler.js';
import { pool } from './config/database.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

// Trust proxy — Railway runs behind a reverse proxy
app.set('trust proxy', 1);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173' },
});

// Security + performance middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Global rate limiter — 100 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Search-specific limiter — 30 searches/min per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Search rate limit exceeded. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/search/query', searchLimiter, searchRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/nudge-cash', nudgeCashRoutes);
app.use('/api/sports', sportsRoutes);

// Cache-control for public GET endpoints
app.use('/api/sports', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300');
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Database connection failed:', err);
  } else {
    logger.info('Database connected successfully');
  }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Nudge backend running on port ${PORT}`);
});

export { app, httpServer, io };
