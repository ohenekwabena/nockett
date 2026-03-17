-- Migration: Add role column to invites table
ALTER TABLE public.invites ADD COLUMN role text NOT NULL DEFAULT 'user';
ALTER TABLE public.invites ADD CONSTRAINT invites_role_check CHECK (role IN ('user', 'admin'));
