-- Synapse Cloud Sync Schema
-- Run this in your Supabase SQL Editor to set up the database.

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Conversations table
create table if not exists public.conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  platform_conversation_id text not null,
  title text not null default 'Untitled',
  messages jsonb not null default '[]'::jsonb,
  message_count integer not null default 0,
  token_estimate integer not null default 0,
  tags text[] not null default '{}',
  auto_tags text[] not null default '{}',
  is_archived boolean not null default false,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Context cards table
create table if not exists public.context_cards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null references public.conversations(id) on delete cascade,
  summary text not null,
  key_points text[] not null default '{}',
  generated_prompt text not null default '',
  topics text[] not null default '{}',
  entities text[] not null default '{}',
  intent text not null default 'general_qa',
  continuation_hints text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- User settings table
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Subscriptions table (managed by Stripe webhooks)
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_conversations_platform on public.conversations(platform);
create index if not exists idx_context_cards_user_id on public.context_cards(user_id);
create index if not exists idx_context_cards_conversation_id on public.context_cards(conversation_id);
create index if not exists idx_context_cards_topics on public.context_cards using gin(topics);

-- Row Level Security
alter table public.conversations enable row level security;
alter table public.context_cards enable row level security;
alter table public.user_settings enable row level security;
alter table public.subscriptions enable row level security;

-- Policies: Users can only access their own data
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

create policy "Users can view own context cards"
  on public.context_cards for select
  using (auth.uid() = user_id);

create policy "Users can insert own context cards"
  on public.context_cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update own context cards"
  on public.context_cards for update
  using (auth.uid() = user_id);

create policy "Users can delete own context cards"
  on public.context_cards for delete
  using (auth.uid() = user_id);

create policy "Users can view own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role manages subscriptions via webhooks (no user insert/update policies needed)

-- Auto-set user_id on insert via trigger
create or replace function public.set_user_id()
returns trigger as $$
begin
  new.user_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_conversations_user_id
  before insert on public.conversations
  for each row execute function public.set_user_id();

create trigger set_context_cards_user_id
  before insert on public.context_cards
  for each row execute function public.set_user_id();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

create trigger update_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.update_updated_at();
