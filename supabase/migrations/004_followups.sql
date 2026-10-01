-- Follow-ups: the table already exists in production with
-- (id, employee_id, contact, subject, due_date, status, last_activity_at, created_at).
-- This migration documents it and adds what is needed to link follow-ups to
-- communications and de-duplicate automatically created follow-ups.

create table if not exists followups (
 id uuid primary key default gen_random_uuid(),
 employee_id uuid references profiles(id),
 contact text,
 subject text,
 due_date timestamptz,
 status text not null default 'open',
 last_activity_at timestamptz,
 created_at timestamptz not null default now()
);

alter table followups add column if not exists communication_id uuid references communications(id) on delete cascade;
alter table followups add column if not exists source text not null default 'manual';
alter table followups add column if not exists next_action text;
alter table followups add column if not exists created_by uuid;
alter table followups add column if not exists completed_at timestamptz;

create index if not exists followups_employee_status_idx on followups(employee_id, status);

-- At most one automatically created follow-up per communication.
create unique index if not exists followups_auto_comm_uniq
  on followups (communication_id)
  where source = 'auto';

alter table followups enable row level security;
