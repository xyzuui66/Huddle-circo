-- ==========================================
-- EVENT SYSTEM TABLES
-- ==========================================

-- 1. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL, -- 'gaming', 'edit', 'streaming', 'collab', 'other'
  image_url text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  location text,
  max_attendees integer,
  status text DEFAULT 'upcoming', -- 'upcoming', 'live', 'ended', 'cancelled'
  visibility text DEFAULT 'public', -- 'public', 'friends', 'private'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. EVENT ATTENDEES TABLE
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'joined', -- 'joined', 'interested', 'cancelled'
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 3. EVENT POSTS TABLE (untuk share momen di event)
CREATE TABLE IF NOT EXISTS event_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_urls text[], -- array of URLs
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. EVENT LIVE TABLE (untuk live stream di event)
CREATE TABLE IF NOT EXISTS event_live (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  stream_url text,
  is_live boolean DEFAULT false,
  viewer_count integer DEFAULT 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. EVENT REMINDERS TABLE
CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remind_at timestamp with time zone NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_posts_event_id ON event_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_live_event_id ON event_live(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON event_reminders(event_id);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE event_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE event_live;

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Events (public read, creator can manage)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are public read" ON events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON events FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own events" ON events FOR UPDATE 
  USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own events" ON events FOR DELETE 
  USING (auth.uid() = creator_id);

-- Event Attendees (users can see attendees, manage own)
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event attendees are public" ON event_attendees FOR SELECT USING (true);
CREATE POLICY "Users can join events" ON event_attendees FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON event_attendees FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can leave events" ON event_attendees FOR DELETE 
  USING (auth.uid() = user_id);

-- Event Posts (public read, users can post own)
ALTER TABLE event_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event posts are public" ON event_posts FOR SELECT USING (true);
CREATE POLICY "Users can post in events" ON event_posts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON event_posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Event Live (public read, hosts can manage)
ALTER TABLE event_live ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event live is public" ON event_live FOR SELECT USING (true);
CREATE POLICY "Hosts can manage event live" ON event_live FOR ALL 
  USING (auth.uid() = host_id);

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- (Uncomment to seed with sample data)
-- INSERT INTO events (creator_id, title, description, category, start_date, end_date, location, max_attendees) 
-- VALUES 
-- (SELECT id FROM profiles LIMIT 1, 'Gaming Session', 'Competitive gaming tournament', 'gaming', 
--  NOW() + INTERVAL '7 days', NOW() + INTERVAL '8 days', 'Discord', 100);

-- ==========================================
-- DONE!
-- ==========================================
