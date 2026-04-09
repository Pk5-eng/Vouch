-- Vouch — Full Database Schema
-- Run this in your Supabase SQL editor

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  notification_email TEXT,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trust_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES trust_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  vouch_context TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  context TEXT,
  category TEXT NOT NULL CHECK (category IN ('career', 'academics', 'life', 'emotional', 'logistics', 'building')),
  visibility TEXT NOT NULL DEFAULT 'global' CHECK (visibility IN ('global', 'trust_group', 'veiled')),
  trust_group_id UUID REFERENCES trust_groups(id) ON DELETE SET NULL,
  is_veiled BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  outcome_text TEXT,
  outcome_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experience TEXT NOT NULL,
  takeaway TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE helpfulness_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  rated_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_from_asker BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, rated_by)
);

CREATE TABLE gratitude_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, from_user_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_response', 'marked_helpful', 'outcome_posted', 'group_invite', 'group_question', 'vouch_received')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Automatically bump question's updated_at when a new response is added
-- This powers the activity-weighted recency feed sort
CREATE OR REPLACE FUNCTION update_question_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions SET updated_at = NOW() WHERE id = NEW.question_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_question_on_response
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_question_timestamp();

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW user_helpfulness AS
SELECT
  r.author_id AS user_id,
  COUNT(hr.id) AS total_helpful_ratings,
  COUNT(CASE WHEN hr.is_from_asker THEN 1 END) AS helpful_to_asker_count,
  COUNT(DISTINCT r.question_id) AS questions_helped_on
FROM responses r
LEFT JOIN helpfulness_ratings hr ON hr.response_id = r.id
GROUP BY r.author_id;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_questions_author ON questions(author_id);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_visibility ON questions(visibility);
CREATE INDEX idx_questions_trust_group ON questions(trust_group_id);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_questions_updated_at ON questions(updated_at DESC);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_author ON responses(author_id);
CREATE INDEX idx_helpfulness_response ON helpfulness_ratings(response_id);
CREATE INDEX idx_helpfulness_rated_by ON helpfulness_ratings(rated_by);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_trust_group_members_group ON trust_group_members(group_id);
CREATE INDEX idx_trust_group_members_user ON trust_group_members(user_id);
CREATE INDEX idx_trust_groups_created_by ON trust_groups(created_by);
CREATE INDEX idx_gratitude_notes_from_user ON gratitude_notes(from_user_id);
CREATE INDEX idx_responses_created_at ON responses(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE helpfulness_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: anyone authenticated can read profiles; users can update their own
CREATE POLICY "Users are viewable by authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Trust Groups: viewable by members or if public
CREATE POLICY "Trust groups viewable by members" ON trust_groups
  FOR SELECT USING (
    NOT is_private
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trust_group_members
      WHERE group_id = trust_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create trust groups" ON trust_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their trust groups" ON trust_groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their trust groups" ON trust_groups
  FOR DELETE USING (auth.uid() = created_by);

-- Trust Group Members
CREATE POLICY "Members viewable by group members" ON trust_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trust_group_members tgm
      WHERE tgm.group_id = trust_group_members.group_id AND tgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can add members" ON trust_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trust_groups
      WHERE id = group_id AND created_by = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can leave groups" ON trust_group_members
  FOR DELETE USING (user_id = auth.uid());

-- Questions: global visible to all auth users; trust_group visible to members
CREATE POLICY "Global questions viewable by authenticated" ON questions
  FOR SELECT USING (
    visibility = 'global'
    OR visibility = 'veiled'
    OR author_id = auth.uid()
    OR (
      visibility = 'trust_group'
      AND EXISTS (
        SELECT 1 FROM trust_group_members
        WHERE group_id = questions.trust_group_id AND user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their questions" ON questions
  FOR UPDATE USING (auth.uid() = author_id);

-- Responses: viewable if you can see the question
CREATE POLICY "Responses viewable with question access" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions q
      WHERE q.id = responses.question_id
      AND (
        q.visibility = 'global'
        OR q.visibility = 'veiled'
        OR q.author_id = auth.uid()
        OR (
          q.visibility = 'trust_group'
          AND EXISTS (
            SELECT 1 FROM trust_group_members
            WHERE group_id = q.trust_group_id AND user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Authenticated users can respond" ON responses
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Helpfulness Ratings
CREATE POLICY "Ratings viewable by authenticated" ON helpfulness_ratings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can rate" ON helpfulness_ratings
  FOR INSERT WITH CHECK (auth.uid() = rated_by);

CREATE POLICY "Users can remove their rating" ON helpfulness_ratings
  FOR DELETE USING (auth.uid() = rated_by);

-- Gratitude Notes
CREATE POLICY "Notes viewable by sender and recipient" ON gratitude_notes
  FOR SELECT USING (
    from_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM responses r
      WHERE r.id = gratitude_notes.response_id AND r.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can create gratitude notes" ON gratitude_notes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Notifications
CREATE POLICY "Users see their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Note: In production, notifications should be created via a SECURITY DEFINER function
-- to prevent users from sending arbitrary notifications. This policy prevents self-notification
-- and requires authentication as a baseline guard for the prototype.
CREATE POLICY "Authenticated users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id != auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());
