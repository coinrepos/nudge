-- Add streak tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_search_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_last_search_date ON users(last_search_date);
