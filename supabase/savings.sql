-- ───────────────────────────────────────────────────────────────────────────
-- MÓDULO ALMACÉN — metas de ahorro con abonos y saldo de Binance registrado.
-- KronoMeta NO se conecta a Binance: el perfil y el saldo los mantiene el
-- usuario, y la app los actualiza al abonar o al descontar una meta lograda.
-- Aditivo, no destructivo. Copiar y pegar en el editor SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

-- Perfil de Binance (uno por usuario) con el saldo registrado
create table if not exists public.binance_profile (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null default '',
  email       text,
  binance_uid text,                                   -- Binance ID / Pay ID
  currency    text not null default 'USDT',
  balance     numeric(14,2) not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Metas de ahorro ("teléfono nuevo 200$")
create table if not exists public.savings_goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  target_amount    numeric(14,2) not null check (target_amount > 0),
  icon             text not null default '🎯',
  color            text not null default '#00FF88',
  -- active: ahorrando · completed: lograda, el dinero sigue en Binance ·
  -- withdrawn: lograda y ya descontada del saldo (se compró / se retiró)
  status           text not null default 'active' check (status in ('active', 'completed', 'withdrawn')),
  completed_at     timestamptz,
  withdrawn_at     timestamptz,
  withdrawn_amount numeric(14,2),
  created_at       timestamptz default now()
);

create index if not exists savings_goals_user_idx on public.savings_goals (user_id, created_at);

-- Abonos a cada meta
create table if not exists public.savings_contributions (
  id         uuid primary key default gen_random_uuid(),
  goal_id    uuid not null references public.savings_goals(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  amount     numeric(14,2) not null check (amount > 0),
  note       text,
  created_at timestamptz default now()
);

create index if not exists savings_contributions_goal_idx on public.savings_contributions (goal_id);

-- Historial de cambios del saldo registrado (ajustes, depósitos, descuentos)
create table if not exists public.binance_balance_moves (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  delta         numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  reason        text not null,
  goal_id       uuid references public.savings_goals(id) on delete set null,
  created_at    timestamptz default now()
);

create index if not exists binance_balance_moves_user_idx on public.binance_balance_moves (user_id, created_at desc);

-- Seguridad: cada usuario solo ve y modifica sus propios datos
alter table public.binance_profile       enable row level security;
alter table public.savings_goals         enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.binance_balance_moves enable row level security;

drop policy if exists "binance_profile_owner" on public.binance_profile;
create policy "binance_profile_owner" on public.binance_profile
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings_goals_owner" on public.savings_goals;
create policy "savings_goals_owner" on public.savings_goals
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "savings_contributions_owner" on public.savings_contributions;
create policy "savings_contributions_owner" on public.savings_contributions
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "binance_balance_moves_owner" on public.binance_balance_moves;
create policy "binance_balance_moves_owner" on public.binance_balance_moves
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cambia el saldo de forma atómica y deja constancia en el historial.
-- security invoker: corre con los permisos (y RLS) del usuario que la llama.
create or replace function public.adjust_binance_balance(
  p_delta  numeric,
  p_reason text,
  p_goal   uuid default null
) returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_balance numeric;
begin
  update public.binance_profile
     set balance = balance + p_delta, updated_at = now()
   where user_id = auth.uid()
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'Perfil de Binance no configurado';
  end if;

  insert into public.binance_balance_moves (user_id, delta, balance_after, reason, goal_id)
  values (auth.uid(), p_delta, new_balance, p_reason, p_goal);

  return new_balance;
end;
$$;

grant execute on function public.adjust_binance_balance(numeric, text, uuid) to authenticated;
