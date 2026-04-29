-- ==========================================
-- GIFT SYSTEM TABLES (FIXED & COMPLETE)
-- ==========================================

-- 1. GIFTS TABLE (Gift types - master data)
CREATE TABLE IF NOT EXISTS gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  price integer NOT NULL,
  animation text NOT NULL DEFAULT 'float_up',
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. STREAM_GIFTS TABLE (Gift transactions)
CREATE TABLE IF NOT EXISTS stream_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL,
  gifter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gift_id uuid NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  total_amount integer NOT NULL,
  gifter_name text NOT NULL,
  gifter_note text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  confirmed_at timestamp with time zone
);

-- 3. WALLETS TABLE (Host earnings)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  bank_account text,
  bank_name text,
  account_holder text,
  donation_note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. TRANSACTIONS TABLE (History)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount integer NOT NULL,
  description text,
  reference_id uuid,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone DEFAULT now()
);

-- 5. LIVE_STREAMS TABLE (Stream metadata)
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  is_live boolean DEFAULT false,
  viewer_count integer DEFAULT 0,
  total_gifts_amount integer DEFAULT 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  agora_channel_name text,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- INDEXES (for performance)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_gifts_id ON gifts(id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_stream_id ON stream_gifts(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_gifter_id ON stream_gifts(gifter_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_gift_id ON stream_gifts(gift_id);
CREATE INDEX IF NOT EXISTS idx_stream_gifts_status ON stream_gifts(status);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_live_streams_host_id ON live_streams(host_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_live ON live_streams(is_live);
CREATE INDEX IF NOT EXISTS idx_live_streams_created_at ON live_streams(created_at);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE stream_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;

-- ==========================================
-- INSERT SAMPLE GIFTS (No emoji in DB)
-- ==========================================

DELETE FROM gifts WHERE name IN ('Rose', 'Heart', 'Star', 'Diamond', 'Crown', 'Fireworks', 'Rocket', 'Trophy', 'Fire');

INSERT INTO gifts (name, icon, price, animation, display_order) VALUES
('Rose', 'rose', 5000, 'float_up_spin', 1),
('Heart', 'heart', 10000, 'heartbeat_pulse', 2),
('Star', 'star', 20000, 'twinkle_float', 3),
('Diamond', 'diamond', 50000, 'sparkle_spin', 4),
('Crown', 'crown', 100000, 'crown_glow', 5),
('Fireworks', 'fireworks', 200000, 'explosion_burst', 6),
('Rocket', 'rocket', 500000, 'rocket_launch', 7),
('Trophy', 'trophy', 1000000, 'trophy_bounce', 8),
('Fire', 'fire', 2000000, 'fire_blast', 9);

-- ==========================================
-- RLS (ROW LEVEL SECURITY) - FIXED
-- ==========================================

-- Gifts (public read only)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gifts are public" ON gifts;
CREATE POLICY "Gifts are public" ON gifts FOR SELECT USING (true);

-- Stream Gifts (public read, own insert)
ALTER TABLE stream_gifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stream gifts public read" ON stream_gifts;
DROP POLICY IF EXISTS "Users can insert stream gifts" ON stream_gifts;
CREATE POLICY "Stream gifts public read" ON stream_gifts FOR SELECT USING (true);
CREATE POLICY "Users can insert stream gifts" ON stream_gifts FOR INSERT
  WITH CHECK (auth.uid() = gifter_id);

-- Wallets (own only)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can see own wallet" ON wallets FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON wallets FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Transactions (own only)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own transactions" ON transactions;
CREATE POLICY "Users can see own transactions" ON transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Live Streams (public read, host manage)
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Live streams public read" ON live_streams;
DROP POLICY IF EXISTS "Hosts can manage own streams" ON live_streams;
CREATE POLICY "Live streams public read" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Hosts can insert streams" ON live_streams FOR INSERT
  WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can manage own streams" ON live_streams FOR UPDATE
  USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete own streams" ON live_streams FOR DELETE
  USING (auth.uid() = host_id);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Auto-update wallet timestamp
CREATE OR REPLACE FUNCTION update_wallets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallets_timestamp_trigger ON wallets;
CREATE TRIGGER update_wallets_timestamp_trigger
BEFORE UPDATE ON wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallets_timestamp();

-- Auto-create wallet for new user
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, total_earned)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_wallet_on_user_create ON profiles;
CREATE TRIGGER create_wallet_on_user_create
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_new_user();

-- ==========================================
-- DONE!
-- ==========================================
-- All tables created, indexes added, RLS secured
-- Ready for production!
