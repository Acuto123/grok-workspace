-- One row per suggested time. People vote instead of posting the same hour again.
-- repeat_rule expands an event across the calendar (the row itself stays one series).

alter table events add column if not exists repeat_rule text not null default 'none';

alter table events drop constraint if exists events_repeat_rule_check;
alter table events add constraint events_repeat_rule_check
  check (repeat_rule in ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly'));

create table if not exists proposal_votes (
  proposal_id text not null references time_proposals (id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);

create index if not exists proposal_votes_user_idx on proposal_votes (user_id);

-- Keep the earliest suggestion when the same slot was posted twice.
delete from time_proposals a
using time_proposals b
where a.event_id = b.event_id
  and coalesce(a.start_date, '') = coalesce(b.start_date, '')
  and coalesce(a.end_date, '') = coalesce(b.end_date, '')
  and coalesce(a.start_time, '') = coalesce(b.start_time, '')
  and coalesce(a.end_time, '') = coalesce(b.end_time, '')
  and (
    a.created_at > b.created_at
    or (a.created_at = b.created_at and a.id > b.id)
  );

create unique index if not exists time_proposals_slot_uidx
  on time_proposals (
    event_id,
    coalesce(start_date, ''),
    coalesce(end_date, ''),
    coalesce(start_time, ''),
    coalesce(end_time, '')
  );

-- The person who suggested a time already stands behind it.
insert into proposal_votes (proposal_id, user_id, created_at)
select id, user_id, created_at from time_proposals
on conflict (proposal_id, user_id) do nothing;
