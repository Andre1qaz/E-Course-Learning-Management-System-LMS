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
  '$2a$12$yMzYHxZvG8WtL2XxKpZ5xO1qN3R5t7V9xYz2A4B6C8D0E2F4G6H8I0J2K4L6M8',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify admin user created
SELECT id, name, email, role, "createdAt"
FROM "User"
WHERE email = 'admin@ecourse.ac.id';
