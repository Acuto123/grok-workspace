-- Shared group calendar. Events are visible to every signed-in member.
-- creator_id / user_id are the verified session id (text), never a client guess.

create table if not exists events (
  id text primary key,
  creator_id text not null,
  title text not null default '',
  color text not null default '',
  start_date text,
  end_date text,
  start_time text,
  end_time text,
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_start_date_idx on events (start_date);
create index if not exists events_creator_idx on events (creator_id);

create table if not exists time_proposals (
  id text primary key,
  event_id text not null references events (id) on delete cascade,
  user_id text not null,
  start_date text,
  end_date text,
  start_time text,
  end_time text,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists time_proposals_event_idx on time_proposals (event_id);
create index if not exists time_proposals_user_idx on time_proposals (user_id);

create table if not exists rsvps (
  event_id text not null references events (id) on delete cascade,
  user_id text not null,
  status text not null check (status in ('yes', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists presence (
  user_id text primary key,
  last_seen timestamptz not null default now()
);
