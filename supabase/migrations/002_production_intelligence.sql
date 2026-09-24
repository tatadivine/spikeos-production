alter table profiles add column if not exists department text;
alter table profiles add column if not exists job_title text;
alter table profiles add column if not exists updated_at timestamptz not null default now();

alter table communications add column if not exists sender_name text;
alter table communications add column if not exists organization text;
alter table communications add column if not exists body_preview text;
alter table communications add column if not exists web_link text;
alter table communications add column if not exists sent_at timestamptz;
alter table communications add column if not exists priority text not null default 'normal';
alter table communications add column if not exists next_step text;
alter table communications add column if not exists quality_score integer not null default 0;
alter table communications add column if not exists response_time_minutes integer;
alter table communications add column if not exists updated_at timestamptz not null default now();

create index if not exists communications_external_idx on communications(external_message_id);
create index if not exists communications_owner_lifecycle_idx on communications(owner_id,lifecycle);
create index if not exists commitments_owner_status_idx on commitments(owner_id,status);
create index if not exists alerts_owner_status_idx on alerts(owner_id,status);

create or replace function public.spikeos_is_admin() returns boolean language sql stable as $$
 select exists(select 1 from profiles p where p.id=auth.uid() and p.role in ('administrator','hr'));
$$;

create or replace function public.spikeos_is_manager_of(target uuid) returns boolean language sql stable as $$
 select exists(select 1 from profiles p where p.id=target and p.manager_id=auth.uid());
$$;
