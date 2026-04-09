-- Vouch — Seed Data
-- Run this AFTER schema.sql in Supabase SQL editor
-- NOTE: Replace these UUIDs with actual auth.users IDs if using Supabase Auth
-- For development, these work with the mock data approach

-- ============================================================
-- SEED USERS (5 test users)
-- ============================================================

INSERT INTO users (id, email, display_name, bio, notification_email) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'alex@example.com', 'Alex Chen', 'CS senior, building things and figuring out what''s next', 'alex@example.com'),
  ('a1b2c3d4-0002-4000-8000-000000000002', 'maria@example.com', 'Maria Santos', 'MBA year 1, career changer from engineering, 28 and counting', 'maria@example.com'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'jordan@example.com', 'Jordan Kim', 'Psych junior, pre-med maybe, overthinking everything', 'jordan@example.com'),
  ('a1b2c3d4-0004-4000-8000-000000000004', 'sam@example.com', 'Sam Patel', 'Engineering sophomore, quietly considering design', 'sam@example.com'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'priya@example.com', 'Priya Sharma', 'Class of 2025, now at an early-stage startup, still figuring it out', 'priya@example.com');

-- ============================================================
-- SEED TRUST GROUP
-- ============================================================

INSERT INTO trust_groups (id, name, description, created_by) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'Career Brain Trust', 'A small circle for the big career questions', 'a1b2c3d4-0001-4000-8000-000000000001');

-- ============================================================
-- SEED TRUST GROUP MEMBERS
-- ============================================================

INSERT INTO trust_group_members (group_id, user_id, role, vouch_context) VALUES
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'creator', NULL),
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', 'member', 'Brilliant at breaking down strategy for technical founders'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0005-4000-8000-000000000005', 'member', 'She mentored me through career transition anxiety'),
  ('b1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0003-4000-8000-000000000003', 'member', 'Thoughtful about big decisions and always shows up');

-- ============================================================
-- SEED QUESTIONS
-- ============================================================

-- Q1: Alex, global, career
INSERT INTO questions (id, author_id, title, context, category, visibility, status, outcome_text, outcome_at) VALUES
  ('c1b2c3d4-0001-4000-8000-000000000001',
   'a1b2c3d4-0001-4000-8000-000000000001',
   'Has anyone turned down a big tech offer to work on their own thing? What did the first 6 months look like?',
   'I have a return offer from a FAANG company after my internship. Great pay, great brand. But I''ve been working on a side project that''s getting traction — a developer tool for API testing. Part of me says take the safe route, part of me says I''ll regret not trying. For those who chose the startup path over big tech: what did those first 6 months actually look like? Were you ever glad you made that choice?',
   'career', 'global', 'resolved',
   'I turned down the offer. Two weeks in and it''s terrifying but I wake up excited every morning. Priya''s advice about the first 90 days was exactly what I needed. Building in public, shipping fast, talking to users every day.',
   NOW() - INTERVAL '2 days');

-- Q2: Veiled, global, emotional
INSERT INTO questions (id, author_id, title, context, category, visibility, is_veiled) VALUES
  ('c1b2c3d4-0002-4000-8000-000000000002',
   'a1b2c3d4-0004-4000-8000-000000000004',
   'I feel like I''m disappointing my parents by not wanting to be an engineer. Has anyone navigated family pressure about career choices?',
   'First-gen student. My parents immigrated so I could have opportunities they didn''t. They see engineering as the safe, respectable path. But I''m drawn to design and product work. I feel guilty even thinking about it. Has anyone else dealt with this kind of pressure? How did you have that conversation?',
   'emotional', 'global', TRUE);

-- Q3: Maria, trust group, life
INSERT INTO questions (id, author_id, title, context, category, visibility, trust_group_id) VALUES
  ('c1b2c3d4-0003-4000-8000-000000000003',
   'a1b2c3d4-0002-4000-8000-000000000002',
   'I''m 28 and surrounded by 23-year-olds in my MBA cohort. Anyone else dealt with the age gap feeling?',
   'Came from 5 years in engineering. Most of my cohort went straight from undergrad. I know the experience is an asset intellectually, but socially it''s weird. I feel like I''m in a different life stage. Anyone else navigate this?',
   'life', 'trust_group', 'b1b2c3d4-0001-4000-8000-000000000001');

-- ============================================================
-- SEED RESPONSES
-- ============================================================

-- Priya responds to Q1
INSERT INTO responses (id, question_id, author_id, experience, takeaway) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001',
   'c1b2c3d4-0001-4000-8000-000000000001',
   'a1b2c3d4-0005-4000-8000-000000000005',
   'I turned down a Series B offer (good comp, interesting product) to join a 3-person startup as employee #4. The first 6 months were genuinely hard — I went from a structured environment with clear goals to "figure out what needs to exist and build it." There were weeks where I questioned everything. The financial hit was real too. But around month 4, something clicked. I was learning faster than I ever had, shipping things that users actually touched, and making decisions that mattered. Now 14 months in, I can''t imagine going back. The growth curve is incomparable.',
   'The first 90 days are the hardest. Set a personal checkpoint at 90 days — if you''re still miserable then, it''s okay to reconsider. But give yourself real time before judging. Also: talk to 5 people who made the same choice before you decide. Every conversation will add nuance.');

-- Jordan responds to Q2
INSERT INTO responses (id, question_id, author_id, experience, takeaway) VALUES
  ('d1b2c3d4-0002-4000-8000-000000000002',
   'c1b2c3d4-0002-4000-8000-000000000002',
   'a1b2c3d4-0003-4000-8000-000000000003',
   'This hits close to home. My parents are both doctors and expected me to follow the same path. I spent my first two years in pre-med doing well academically but feeling empty. When I switched to psychology, my mom didn''t speak to me about it for a month. It was one of the hardest periods of my life. But I also started actually caring about what I was learning for the first time. My dad came around first — he saw me light up talking about research in a way I never did about organic chemistry. My mom took longer, but she got there.',
   'The conversation isn''t one conversation — it''s a series of small ones over time. Don''t try to have the Big Talk. Just start letting them see your genuine excitement for the thing you actually want to do. Actions speak louder than arguments.');

-- Alex responds to Q3
INSERT INTO responses (id, question_id, author_id, experience, takeaway) VALUES
  ('d1b2c3d4-0003-4000-8000-000000000003',
   'c1b2c3d4-0003-4000-8000-000000000003',
   'a1b2c3d4-0001-4000-8000-000000000001',
   'Different angle but I relate — I''m one of the youngest in my program and I''ve felt the opposite side of that gap. The people with work experience just seem to get things faster, have better frameworks for decision-making, and honestly give better advice in study groups. From where I sit, the 28-year-olds are the ones everyone wants to work with. You might feel the age gap socially, but professionally you''re the person everyone wants on their team. I''ve learned more from classmates with work experience than from most professors.',
   'Your "different life stage" is actually your superpower. Lean into it rather than trying to fit in with the younger crowd''s social scene. Find the other career changers — they''re probably feeling the same way and would love to connect.');

-- ============================================================
-- SEED HELPFULNESS RATINGS
-- ============================================================

-- Alex rates Priya's response as helpful (asker rating)
INSERT INTO helpfulness_ratings (response_id, rated_by, is_from_asker) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', TRUE);

-- Maria rates Priya's response as helpful
INSERT INTO helpfulness_ratings (response_id, rated_by, is_from_asker) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0002-4000-8000-000000000002', FALSE);

-- Sam rates Jordan's response as helpful (asker rating, since Sam posted Q2)
INSERT INTO helpfulness_ratings (response_id, rated_by, is_from_asker) VALUES
  ('d1b2c3d4-0002-4000-8000-000000000002', 'a1b2c3d4-0004-4000-8000-000000000004', TRUE);

-- Maria rates Alex's response as helpful (asker rating)
INSERT INTO helpfulness_ratings (response_id, rated_by, is_from_asker) VALUES
  ('d1b2c3d4-0003-4000-8000-000000000003', 'a1b2c3d4-0002-4000-8000-000000000002', TRUE);

-- ============================================================
-- SEED GRATITUDE NOTE
-- ============================================================

INSERT INTO gratitude_notes (response_id, from_user_id, note) VALUES
  ('d1b2c3d4-0001-4000-8000-000000000001', 'a1b2c3d4-0001-4000-8000-000000000001', 'Your story about the first 90 days was exactly what I needed to hear. Thank you for being so honest about the hard parts.');

-- ============================================================
-- SEED NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (user_id, type, title, body, link) VALUES
  ('a1b2c3d4-0005-4000-8000-000000000005', 'marked_helpful', 'Alex found your experience helpful', 'Your response about turning down a Series B offer was marked as helpful.', '/question/c1b2c3d4-0001-4000-8000-000000000001'),
  ('a1b2c3d4-0005-4000-8000-000000000005', 'outcome_posted', 'Alex closed the loop', 'Alex shared what they decided about the big tech offer.', '/question/c1b2c3d4-0001-4000-8000-000000000001'),
  ('a1b2c3d4-0003-4000-8000-000000000003', 'marked_helpful', 'Someone found your experience helpful', 'Your response about navigating family pressure was marked as helpful.', '/question/c1b2c3d4-0002-4000-8000-000000000002');
