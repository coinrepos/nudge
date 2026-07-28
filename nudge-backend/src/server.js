import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import creditRoutes from './routes/credits.js';
import leaderboardRoutes from './routes/leaderboard.js';
import nudgeCashRoutes from './routes/nudgeCash.js';
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

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.set('io', io);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/nudge-cash', nudgeCashRoutes);

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
