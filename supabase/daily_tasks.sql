create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  reminder_time text,
  task_date date not null,
  completed_at timestamptz,
  timezone text not null default 'America/Caracas',
  created_at timestamptz default now()
);

create index if not exists daily_tasks_user_date_idx
  on public.daily_tasks (user_id, task_date);

alter table public.daily_tasks enable row level security;

drop policy if exists "daily_tasks_owner" on public.daily_tasks;

create policy "daily_tasks_owner"
  on public.daily_tasks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
