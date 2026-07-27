import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import logger from '../utils/logger.js';

const authController = {
  async register(req, res) {
    const { email, password, username } = req.body;
    try {
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, username, social_credits) VALUES ($1, $2, $3, $4) RETURNING id, email, username, social_credits',
        [email, hashedPassword, username, 0]
      );
      const user = result.rows[0];
      const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret', { expiresIn: '7d' });
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          socialCredits: user.social_credits,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;
    try {
      if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
      const result = await pool.query('SELECT id, email, username, password_hash, social_credits FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = result.rows[0];
      if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
      const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret', { expiresIn: '7d' });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          socialCredits: user.social_credits,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  async refreshToken(req, res) {
    const { refreshToken } = req.body;
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret');
      const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });
      res.json({ accessToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  },

  async getProfile(req, res) {
    try {
      const result = await pool.query(
        'SELECT id, email, username, social_credits, streak_count, created_at FROM users WHERE id = $1',
        [req.userId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
      const user = result.rows[0];
      // Return camelCase to match frontend expectations
      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        socialCredits: user.social_credits,
        streak: user.streak_count || 0,
        createdAt: user.created_at,
      });
    } catch (error) {
      logger.error('Profile fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },
};

export default authController;
