-- Seed Data for E-Course LMS
-- Run this AFTER running DATABASE_SCHEMA.sql

-- Insert Admin User
-- Password: Password123! (bcrypt rounds=12)
INSERT INTO "User" (
  id,
  name,
  email,
  password,
  role,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin001',
  'Administrator',
  'admin@ecourse.ac.id',
  '$2b$12$ZxcAp.lmZqmiafGB1tG92OR2Rpz7o53IkRsmJyfMVWgfU.rmQVkX.',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify admin user created
SELECT id, name, email, role, "createdAt"
FROM "User"
WHERE email = 'admin@ecourse.ac.id';
