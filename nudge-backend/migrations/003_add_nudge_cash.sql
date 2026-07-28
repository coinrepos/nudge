-- Nudge Cash rewards system
-- Supports affiliate cashback (real money) alongside cosmetic social credits

-- Nudge Cash balance (one row per user)
CREATE TABLE IF NOT EXISTS nudge_cash (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  pending_balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cashback transactions
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  merchant VARCHAR(255),
  product_title VARCHAR(500),
  order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, paid, cancelled
  cashback_rate DECIMAL(5, 2),
  original_purchase_amount DECIMAL(10, 2),
  search_query VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Affiliate click tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  merchant VARCHAR(255),
  search_query VARCHAR(500),
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Reward type registry (extensible rewards system)
CREATE TABLE IF NOT EXISTS reward_types (
  id SERIAL PRIMARY KEY,
  type_key VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_real_money BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default reward types
INSERT INTO reward_types (type_key, display_name, description, is_real_money) VALUES
  ('social_credits', 'Social Credits', 'Cosmetic credits earned from spins and winning combinations', FALSE),
  ('nudge_cash', 'Nudge Cash', 'Real cashback earned from shopping through Nudge', TRUE)
ON CONFLICT (type_key) DO NOTHING;

-- User reward wallet (generic, supports multiple reward types)
CREATE TABLE IF NOT EXISTS user_rewards (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  reward_type_id INT REFERENCES reward_types(id),
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  UNIQUE(user_id, reward_type_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reward transaction log (generic)
CREATE TABLE IF NOT EXISTS reward_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  reward_type_id INT REFERENCES reward_types(id),
  amount DECIMAL(10, 2) NOT NULL,
  source VARCHAR(100), -- spin, cashback, streak_bonus, referral, etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nudge_cash_user_id ON nudge_cash(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_user_id ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_status ON cashback_transactions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_id ON reward_transactions(user_id);
