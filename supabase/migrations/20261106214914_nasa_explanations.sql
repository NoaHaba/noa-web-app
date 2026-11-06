
create table public.nasa_explanations (
  date date primary key,
  hebrew_title text not null,
  hebrew_summary text not null,
  tags jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.nasa_explanations enable row level security;
