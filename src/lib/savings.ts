import { createClient } from '@/lib/supabase'
import {
  BinanceProfile, SavingsGoal, SavingsContribution, BalanceMove, SavingsGoalWithProgress,
} from '@/types/savings'

export { SAVINGS_GOAL_XP } from '@/lib/gamification'

export const CURRENCIES = ['USDT', 'USDC', 'FDUSD', 'USD', 'BTC', 'ETH', 'BNB']

// Emojis sugeridos al crear una meta de ahorro
export const SAVINGS_ICONS = ['🎯', '📱', '💻', '⚽', '🛂', '✈️', '🚗', '🏍️', '🎮', '🎧', '👟', '🏠', '🎓', '💍', '🎁', '🩺']

// Redondeo a 2 decimales (evita 0.1 + 0.2 = 0.30000000000000004)
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function formatMoney(amount: number, currency = 'USDT'): string {
  const n = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  return ['USD', 'USDT', 'USDC', 'FDUSD'].includes(currency) ? `$${n}` : `${n} ${currency}`
}

// Convierte lo escrito por el usuario ("1.250,50", "1250.5", "200$") en número
export function parseAmount(raw: string): number {
  let s = raw.replace(/[^\d.,-]/g, '')
  // Si tiene coma y punto, el último separador es el decimal
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? round2(n) : NaN
}

export function withProgress(goal: SavingsGoal, contributions: SavingsContribution[]): SavingsGoalWithProgress {
  const own    = contributions.filter(c => c.goal_id === goal.id)
  const saved  = round2(own.reduce((a, c) => a + Number(c.amount), 0))
  const target = Number(goal.target_amount)
  return {
    ...goal,
    target_amount: target,
    withdrawn_amount: goal.withdrawn_amount != null ? Number(goal.withdrawn_amount) : null,
    contributions: own.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    saved,
    pct: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    remaining: round2(Math.max(0, target - saved)),
  }
}

export interface SavingsData {
  profile: BinanceProfile | null
  goals: SavingsGoalWithProgress[]
  moves: BalanceMove[]
  missingTables: boolean          // la migración supabase/savings.sql no se ha ejecutado
}

export async function loadSavings(userId: string): Promise<SavingsData> {
  const supabase = createClient()
  const [profileRes, goalsRes, contribRes, movesRes] = await Promise.all([
    supabase.from('binance_profile').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('savings_goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('savings_contributions').select('*').eq('user_id', userId),
    supabase.from('binance_balance_moves').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(30),
  ])

  // 42P01 = tabla inexistente (Postgres) · PGRST205 = tabla no encontrada (PostgREST)
  const missing = [profileRes, goalsRes].some(r =>
    r.error && (r.error.code === '42P01' || r.error.code === 'PGRST205' || /does not exist|could not find/i.test(r.error.message)))

  const contributions = ((contribRes.data || []) as SavingsContribution[]).map(c => ({ ...c, amount: Number(c.amount) }))
  const profile = profileRes.data ? { ...profileRes.data, balance: Number(profileRes.data.balance) } as BinanceProfile : null

  return {
    profile,
    goals: ((goalsRes.data || []) as SavingsGoal[]).map(g => withProgress(g, contributions)),
    moves: ((movesRes.data || []) as BalanceMove[]).map(m => ({ ...m, delta: Number(m.delta), balance_after: Number(m.balance_after) })),
    missingTables: missing,
  }
}

// Dinero apartado en metas que siguen en Binance (activas o logradas sin descontar)
export function allocatedAmount(goals: SavingsGoalWithProgress[]): number {
  return round2(goals.filter(g => g.status !== 'withdrawn').reduce((a, g) => a + g.saved, 0))
}

// ── Perfil y saldo ──────────────────────────────────────────────────────────

export async function saveProfile(
  userId: string,
  data: Pick<BinanceProfile, 'first_name' | 'last_name' | 'email' | 'binance_uid' | 'currency'>,
  initialBalance?: number,
) {
  const supabase = createClient()
  const row: Record<string, unknown> = { user_id: userId, ...data, updated_at: new Date().toISOString() }
  if (initialBalance !== undefined) row.balance = initialBalance
  return supabase.from('binance_profile').upsert(row).select().single()
}

// Suma/resta al saldo registrado (atómico en la base de datos + historial)
export async function adjustBalance(delta: number, reason: string, goalId?: string) {
  const supabase = createClient()
  return supabase.rpc('adjust_binance_balance', { p_delta: round2(delta), p_reason: reason, p_goal: goalId ?? null })
}

// ── Metas de ahorro ─────────────────────────────────────────────────────────

export async function createSavingsGoal(userId: string, g: Pick<SavingsGoal, 'title' | 'target_amount' | 'icon' | 'color'>) {
  const supabase = createClient()
  return supabase.from('savings_goals').insert({ user_id: userId, ...g }).select().single()
}

export async function updateSavingsGoal(id: string, patch: Partial<SavingsGoal>) {
  const supabase = createClient()
  return supabase.from('savings_goals').update(patch).eq('id', id).select().single()
}

export async function deleteSavingsGoal(id: string) {
  const supabase = createClient()
  return supabase.from('savings_goals').delete().eq('id', id)
}

export async function addContribution(userId: string, goalId: string, amount: number, note?: string) {
  const supabase = createClient()
  return supabase.from('savings_contributions')
    .insert({ user_id: userId, goal_id: goalId, amount: round2(amount), note: note || null })
    .select().single()
}

export async function deleteContribution(id: string) {
  const supabase = createClient()
  return supabase.from('savings_contributions').delete().eq('id', id)
}
