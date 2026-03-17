-- Profiles
create table if not exists profiles (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  elo_rating integer default 1200,
  wins integer default 0,
  losses integer default 0,
  total_games integer default 0,
  total_xp integer default 0,
  favorite_category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User achievements
create table if not exists user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Matches
create table if not exists matches (
  id uuid default gen_random_uuid() primary key,
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  situation_id text,
  status text default 'waiting' check (status in ('waiting', 'active', 'scoring', 'completed', 'forfeited')),
  player1_text text,
  player2_text text,
  player1_score numeric,
  player2_score numeric,
  winner_id uuid references profiles(id),
  friend_code text unique,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Matchmaking queue
create table if not exists matchmaking_queue (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique,
  elo_rating integer not null,
  joined_at timestamptz default now()
);

-- Weekly leaderboard (materialized view)
create materialized view if not exists weekly_leaderboard as
select
  p.id, p.username, p.avatar_url, p.elo_rating, p.wins, p.losses, p.total_games,
  rank() over (order by p.elo_rating desc) as rank
from profiles p
where p.total_games > 0
order by p.elo_rating desc
limit 100;

-- Row Level Security
alter table profiles enable row level security;
alter table user_achievements enable row level security;
alter table matches enable row level security;
alter table matchmaking_queue enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Achievements: users can read all, insert own
create policy "Achievements viewable by everyone" on user_achievements for select using (true);
create policy "Users can insert own achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- Matches: players can see their matches
create policy "Players can view own matches" on matches for select using (auth.uid() = player1_id or auth.uid() = player2_id or friend_code is not null);
create policy "Players can update own matches" on matches for update using (auth.uid() = player1_id or auth.uid() = player2_id);
create policy "Authenticated users can create matches" on matches for insert with check (auth.uid() = player1_id);

-- Queue: users manage own entry
create policy "Queue viewable" on matchmaking_queue for select using (true);
create policy "Users manage own queue" on matchmaking_queue for insert with check (auth.uid() = user_id);
create policy "Users delete own queue" on matchmaking_queue for delete using (auth.uid() = user_id);

-- Auto-create profile on signup (trigger)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
