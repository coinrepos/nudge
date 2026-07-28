-- Nudge Cash withdrawal requests
-- Tracks user withdrawal requests for PayPal, bank transfer, or gift card

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL, -- paypal, bank, giftcard
  paypal_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'processing', -- processing, completed, rejected
  requested_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
