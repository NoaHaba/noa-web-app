
-- Store completed Tic-Tac-Toe games.
create table public.games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  moves jsonb not null,
  result text not null check (result in ('X', 'O', 'draw')),
  created_at timestamptz not null default now()
);

-- Load each user's games from newest to oldest.
create index games_owner_created_idx
  on public.games (owner_id, created_at desc);

-- Enable Row Level Security.
alter table public.games enable row level security;
