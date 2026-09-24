create extension if not exists pgcrypto;

create table if not exists profiles (
 id uuid primary key,
 email text unique not null,
 display_name text,
 manager_id uuid references profiles(id),
 role text not null default 'employee',
 created_at timestamptz not null default now()
);
create table if not exists communications (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid references profiles(id),
 external_message_id text unique,
 thread_id text,
 sender_email text,
 subject text,
 category text not null default 'internal',
 lifecycle text not null default 'received',
 received_at timestamptz,
 acknowledged_at timestamptz,
 answered_at timestamptz,
 closed_at timestamptz,
 sla_hours integer not null default 48,
 excluded boolean not null default false,
 exclusion_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists communications_owner_idx on communications(owner_id);
create index if not exists communications_received_idx on communications(received_at);
create table if not exists commitments (
 id uuid primary key default gen_random_uuid(),
 communication_id uuid references communications(id) on delete cascade,
 owner_id uuid references profiles(id),
 title text not null,
 due_date timestamptz,
 next_step text,
 status text not null default 'open',
 created_at timestamptz not null default now(),
 completed_at timestamptz
);
create table if not exists alerts (
 id uuid primary key default gen_random_uuid(),
 communication_id uuid references communications(id) on delete cascade,
 owner_id uuid references profiles(id),
 severity text not null default 'info',
 title text not null,
 details jsonb not null default '{}'::jsonb,
 status text not null default 'open',
 created_at timestamptz not null default now(),
 resolved_at timestamptz
);
create table if not exists ai_reviews (
 id uuid primary key default gen_random_uuid(),
 communication_id uuid references communications(id) on delete cascade,
 finding_type text,
 confidence numeric,
 evidence jsonb not null default '[]'::jsonb,
 finding text,
 requires_human_review boolean not null default true,
 performance_record_write_allowed boolean not null default false,
 human_review_status text not null default 'pending',
 reviewed_by uuid references profiles(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists appeals (
 id uuid primary key default gen_random_uuid(),
 communication_id uuid references communications(id) on delete cascade,
 employee_id uuid references profiles(id),
 context text not null,
 status text not null default 'pending',
 manager_id uuid references profiles(id),
 manager_decision text,
 created_at timestamptz not null default now(),
 decided_at timestamptz
);
create table if not exists audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid,
 action text not null,
 target_type text,
 target_id text,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create table if not exists graph_subscriptions (
 id uuid primary key default gen_random_uuid(),
 mailbox_user_id uuid references profiles(id),
 subscription_id text unique not null,
 resource text not null,
 expires_at timestamptz not null,
 client_state_hash text,
 last_renewed_at timestamptz,
 created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table communications enable row level security;
alter table commitments enable row level security;
alter table alerts enable row level security;
alter table ai_reviews enable row level security;
alter table appeals enable row level security;
alter table audit_logs enable row level security;
alter table graph_subscriptions enable row level security;

create or replace function public.is_manager_of(target uuid) returns boolean language sql stable as $$
 select exists(select 1 from profiles p where p.id=target and p.manager_id=auth.uid());
$$;

create policy "profiles own or manager" on profiles for select using (id=auth.uid() or manager_id=auth.uid());
create policy "communications own or manager" on communications for select using (owner_id=auth.uid() or is_manager_of(owner_id));
create policy "commitments own or manager" on commitments for select using (owner_id=auth.uid() or is_manager_of(owner_id));
create policy "alerts own or manager" on alerts for select using (owner_id=auth.uid() or is_manager_of(owner_id));
create policy "ai reviews own or manager" on ai_reviews for select using (exists(select 1 from communications c where c.id=communication_id and (c.owner_id=auth.uid() or is_manager_of(c.owner_id))));
create policy "appeals own or manager" on appeals for select using (employee_id=auth.uid() or manager_id=auth.uid());
create policy "audit restricted" on audit_logs for select using (actor_id=auth.uid());
create policy "subscriptions restricted" on graph_subscriptions for select using (mailbox_user_id=auth.uid());
