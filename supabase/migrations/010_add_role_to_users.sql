-- Migration: Add role column to users table
ALTER TABLE public.users ADD COLUMN role text NOT NULL DEFAULT 'user';
-- Optionally, add a check constraint for valid roles
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
