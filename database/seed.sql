-- Seed data for development and testing
-- This script inserts sample responses for development purposes

INSERT INTO responses (title, content, tags) VALUES 
(
    'Professional Thank You',
    'Thank you for connecting! I appreciate the opportunity to expand my professional network.',
    '["networking", "professional", "gratitude"]'::jsonb
),
(
    'LinkedIn Connection Request',
    'Hi {{name}}, I''d love to connect and learn more about your work in {{industry}}. Looking forward to staying in touch!',
    '["linkedin", "connection", "networking"]'::jsonb
),
(
    'Follow Up After Meeting',
    'It was great meeting you at {{event}}. I enjoyed our conversation about {{topic}}. Let''s stay in touch!',
    '["follow-up", "networking", "events"]'::jsonb
),
(
    'Job Application Thank You',
    'Thank you for considering my application for the {{position}} role. I''m excited about the opportunity to contribute to {{company}}.',
    '["job-application", "career", "gratitude"]'::jsonb
),
(
    'Collaboration Proposal',
    'I''ve been following your work on {{project}} and would love to explore potential collaboration opportunities.',
    '["collaboration", "partnership", "business"]'::jsonb
),
(
    'Industry Expertise Inquiry',
    'I''m reaching out because of your expertise in {{field}}. Would you be open to a brief conversation about {{specific_topic}}?',
    '["expertise", "consultation", "learning"]'::jsonb
),
(
    'Referral Request',
    'I hope you''re doing well! I''m currently exploring opportunities in {{industry}} and would appreciate any insights or referrals you might have.',
    '["referral", "job-search", "career"]'::jsonb
),
(
    'Event Invitation',
    'I wanted to personally invite you to {{event_name}} on {{date}}. It would be great to have you there!',
    '["events", "invitation", "networking"]'::jsonb
),
(
    'Content Appreciation',
    'I really enjoyed your recent post about {{topic}}. Your insights on {{specific_point}} were particularly valuable.',
    '["content", "engagement", "appreciation"]'::jsonb
),
(
    'Congratulations Message',
    'Congratulations on {{achievement}}! Your dedication and hard work have truly paid off.',
    '["congratulations", "celebration", "professional"]'::jsonb
);

-- Display confirmation message
DO $$
BEGIN
    RAISE NOTICE 'Successfully inserted % sample responses for development', (SELECT COUNT(*) FROM responses);
END $$;