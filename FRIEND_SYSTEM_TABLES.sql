-- ==========================================
-- FRIEND SYSTEM TABLES
-- ==========================================

-- 1. FRIENDS TABLE (Confirmed friendships)
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', -- 'active', 'blocked'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2) -- Prevent duplicates
);

-- 2. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  message text,
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone,
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);

-- 3. USER INTERESTS TABLE
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interest text NOT NULL,
  category text, -- 'gaming', 'content', 'community', 'casual'
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, interest)
);

-- 4. FRIEND SUGGESTIONS TABLE (Cache for performance)
CREATE TABLE IF NOT EXISTS friend_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggested_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text, -- 'mutual_friend', 'shared_interest', 'same_community'
  score integer DEFAULT 0, -- Higher = better suggestion
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, suggested_user_id),
  CHECK (user_id != suggested_user_id)
);

-- 5. FRIEND ACTIVITY TABLE (Feed)
CREATE TABLE IF NOT EXISTS friend_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'joined_event', 'started_stream', 'joined_community', 'posted'
  activity_data jsonb, -- Store additional data
  visibility text DEFAULT 'friends', -- 'friends', 'public', 'private'
  created_at timestamp with time zone DEFAULT now()
);

-- 6. BLOCKED USERS TABLE
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_friends_user_id_1 ON friends(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user_id_2 ON friends(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON user_interests(interest);
CREATE INDEX IF NOT EXISTS idx_friend_suggestions_user_id ON friend_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_activities_user_id ON friend_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE user_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE friend_activities;

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Friends (users can only see their own)
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their friendships" ON friends FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can delete friendships" ON friends FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Friend Requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own friend requests" ON friend_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friend requests" ON friend_requests FOR UPDATE
  USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete friend requests" ON friend_requests FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- User Interests (public read, own edit)
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interests are public" ON user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL
  USING (auth.uid() = user_id);

-- Friend Suggestions (own only)
ALTER TABLE friend_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own suggestions" ON friend_suggestions FOR SELECT
  USING (auth.uid() = user_id);

-- Friend Activities (based on visibility)
ALTER TABLE friend_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friends can see activity" ON friend_activities FOR SELECT
  USING (
    visibility = 'public' OR
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends
      WHERE (user_id_1 = auth.uid() AND user_id_2 = friend_activities.user_id)
         OR (user_id_2 = auth.uid() AND user_id_1 = friend_activities.user_id)
    )
  );
CREATE POLICY "Users can insert own activity" ON friend_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Blocked Users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blocks" ON blocked_users FOR ALL
  USING (auth.uid() = blocker_id);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to check if users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id uuid, user2_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friends
    WHERE (user_id_1 = user1_id AND user_id_2 = user2_id)
       OR (user_id_1 = user2_id AND user_id_2 = user1_id)
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mutual friends count
CREATE OR REPLACE FUNCTION get_mutual_friends_count(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM friends f1
    WHERE (f1.user_id_1 = user1_id OR f1.user_id_2 = user1_id)
      AND EXISTS (
        SELECT 1 FROM friends f2
        WHERE (f2.user_id_1 = user2_id OR f2.user_id_2 = user2_id)
          AND ((f1.user_id_1 = f2.user_id_1 AND f1.user_id_2 = f2.user_id_2)
            OR (f1.user_id_1 = f2.user_id_2 AND f1.user_id_2 = f2.user_id_1))
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get common interests count
CREATE OR REPLACE FUNCTION get_common_interests_count(user1_id uuid, user2_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT interest) FROM user_interests ui1
    WHERE ui1.user_id = user1_id
      AND EXISTS (
        SELECT 1 FROM user_interests ui2
        WHERE ui2.user_id = user2_id
          AND ui1.interest = ui2.interest
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DONE!
-- ==========================================
-- Run this SQL in Supabase SQL Editor
-- All friend system tables created and ready!
