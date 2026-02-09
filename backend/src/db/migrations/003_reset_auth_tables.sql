-- Drop existing auth tables (if they exist)
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
-- Better Auth will auto-create these tables with the correct schema
-- This migration just ensures a clean slate