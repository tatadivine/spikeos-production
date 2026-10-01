-- Coaching feedback: persisted employee/manager actions on calculated coaching
-- signals (dismiss, add context). The signature ties a dismissal to the exact
-- set of records the signal was derived from; if the facts change, the signal
-- is shown again.
create table if not exists coaching_feedback (
 id uuid primary key default gen_random_uuid(),
 insight_key text not null,
 employee_id uuid references profiles(id),
 action text not null check (action in ('dismissed','context')),
 signature text,
 context text,
 created_by uuid,
 created_at timestamptz not null default now()
);
create index if not exists coaching_feedback_employee_idx on coaching_feedback(employee_id, insight_key);
alter table coaching_feedback enable row level security;

-- Manager review state for review signals (e.g. SLA breaches).
-- ai_reviews stores the human decision; nothing is written until a manager acts.
alter table ai_reviews add column if not exists employee_id uuid references profiles(id);
alter table ai_reviews add column if not exists notes text;
alter table ai_reviews add column if not exists updated_at timestamptz not null default now();
create unique index if not exists ai_reviews_comm_type_uniq on ai_reviews(communication_id, finding_type);
