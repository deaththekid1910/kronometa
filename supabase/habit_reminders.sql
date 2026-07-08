-- ───────────────────────────────────────────────────────────────────────────
-- RECORDATORIO DE HÁBITOS — hora diaria opcional para disparar alarma.
-- Los hábitos (goals.type = 'habit') no tenían ningún campo de recordatorio;
-- este script agrega la columna que faltaba. Aditivo, no destructivo.
-- Copiar y pegar en el editor SQL de Supabase.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.goals
  add column if not exists reminder_time text; -- 'HH:MM', hora local del usuario; NULL = sin recordatorio
