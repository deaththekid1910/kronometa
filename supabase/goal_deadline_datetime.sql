-- ───────────────────────────────────────────────────────────────────────────
-- FECHA LÍMITE COMPLETA — deadline pasa de solo-fecha a fecha+hora+segundos.
-- Antes el frontend solo enviaba 'YYYY-MM-DD' (medianoche implícita); ahora
-- envía un ISO timestamp completo en UTC. Si la columna ya es timestamptz
-- este ALTER es un no-op seguro; si era `date`, la migra sin perder datos
-- (los valores existentes quedan a medianoche UTC de ese día, como ya estaban).
-- Copiar y pegar en el editor SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.goals
  alter column deadline type timestamptz using deadline::timestamptz;
