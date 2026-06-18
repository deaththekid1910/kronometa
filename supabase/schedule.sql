-- ───────────────────────────────────────────────────────────────────────────
-- MÓDULO HORARIO — bloques de horario recurrentes por día de la semana y hora.
-- A diferencia de daily_tasks (una sola fecha), estos se repiten cada semana
-- en los días marcados y disparan alarmas/notificaciones a su hora de inicio.
-- Copiar y pegar en el editor SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.schedule_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  -- Días de la semana en los que aplica. Convención JS getDay():
  -- 0 = Domingo, 1 = Lunes, ... 6 = Sábado.
  days_of_week smallint[] not null default '{}',
  start_time text not null,          -- 'HH:MM' — hora de inicio / alarma
  end_time text,                     -- 'HH:MM' — hora de fin (opcional)
  color text not null default '#B026FF',
  notify boolean not null default true,   -- si dispara alarma/notificación
  active boolean not null default true,   -- permite pausar sin eliminar
  timezone text not null default 'America/Caracas',
  created_at timestamptz default now()
);

create index if not exists schedule_blocks_user_idx
  on public.schedule_blocks (user_id, active);

alter table public.schedule_blocks enable row level security;

drop policy if exists "schedule_blocks_owner" on public.schedule_blocks;

create policy "schedule_blocks_owner"
  on public.schedule_blocks
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
