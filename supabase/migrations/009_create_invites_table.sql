-- Create invites table for user invitation system
create table if not exists invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  token text not null unique,
  expires_at timestamp with time zone not null,
  used boolean not null default false,
  created_at timestamp with time zone not null default now()
);

-- Index for quick lookup by token
create index if not exists idx_invites_token on invites(token);
