import { createClient } from '@/lib/supabase'

export interface GoalTimeData {
  id: string
  title: string
  color: string
  type: string
  totalSeconds: number
}

export interface DayActivity {
  date: string
  label: string
  seconds: number
  sessions: number
}

export interface HabitConsistency {
  id: string
  title: string
  color: string
  completedDays: number
  totalDays: number
  pct: number
}

export async function getTimeByGoal(userId: string): Promise<GoalTimeData[]> {
  const supabase = createClient()

  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase.from('goals').select('id, title, color, type').eq('user_id', userId).eq('archived', false),
    supabase.from('timer_sessions').select('goal_id, elapsed_seconds, started_at, is_active').eq('user_id', userId),
  ])

  if (!goals) return []

  const secsByGoal: Record<string, number> = {}
  for (const s of sessions || []) {
    let secs = s.elapsed_seconds || 0
    if (s.is_active && s.started_at) {
      secs += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
    }
    secsByGoal[s.goal_id] = (secsByGoal[s.goal_id] || 0) + secs
  }

  return goals
    .filter(g => (secsByGoal[g.id] || 0) > 0)
    .map(g => ({ ...g, totalSeconds: secsByGoal[g.id] || 0 }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export async function getWeeklyActivity(userId: string): Promise<DayActivity[]> {
  const supabase = createClient()

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data: sessions } = await supabase
    .from('timer_sessions')
    .select('elapsed_seconds, started_at, ended_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())

  const days: DayActivity[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label   = d.toLocaleDateString('es-VE', { weekday: 'short' })

    const daySessions = (sessions || []).filter(s =>
      s.created_at?.startsWith(dateStr)
    )

    const totalSecs = daySessions.reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0)

    days.push({
      date: dateStr,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      seconds: totalSecs,
      sessions: daySessions.length,
    })
  }

  return days
}

export interface DateHistoryItem {
  id: string
  title: string
  color: string
  type: string
  totalSeconds: number
  sessions: number
}

// Reporte del tiempo dedicado a cada meta/hábito en UNA fecha concreta
// (fecha local del usuario, 'YYYY-MM-DD'). Cada ítem es independiente.
export async function getHistoryByDate(userId: string, date: string): Promise<DateHistoryItem[]> {
  const supabase = createClient()

  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase.from('goals').select('id, title, color, type').eq('user_id', userId),
    supabase.from('timer_sessions').select('goal_id, elapsed_seconds, created_at').eq('user_id', userId),
  ])

  if (!goals) return []

  const agg: Record<string, { secs: number; count: number }> = {}
  for (const s of sessions || []) {
    if (!s.created_at) continue
    // Fecha local de la sesión (no UTC) para que caiga en el día correcto
    const d = new Date(s.created_at)
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (localDate !== date) continue
    const a = agg[s.goal_id] || { secs: 0, count: 0 }
    a.secs += s.elapsed_seconds || 0
    a.count += 1
    agg[s.goal_id] = a
  }

  return goals
    .filter(g => agg[g.id] && agg[g.id].secs > 0)
    .map(g => ({ ...g, totalSeconds: agg[g.id].secs, sessions: agg[g.id].count }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export interface DayBreakdown {
  date: string          // 'YYYY-MM-DD' (fecha local)
  totalSeconds: number
  items: DateHistoryItem[]
}

// Historial diario: para los últimos `days` días devuelve, por cada día con
// actividad, el desglose del tiempo dedicado a cada meta/hábito. Ordenado del
// día más reciente al más antiguo.
export async function getDailyHistory(userId: string, days = 30): Promise<DayBreakdown[]> {
  const supabase = createClient()

  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (days - 1))

  const [{ data: goals }, { data: sessions }] = await Promise.all([
    supabase.from('goals').select('id, title, color, type').eq('user_id', userId),
    supabase.from('timer_sessions')
      .select('goal_id, elapsed_seconds, created_at, started_at, is_active')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString()),
  ])

  if (!goals) return []
  const goalMap = new Map(goals.map(g => [g.id, g]))

  // date -> goalId -> { secs, count }
  const byDate: Record<string, Record<string, { secs: number; count: number }>> = {}
  for (const s of sessions || []) {
    if (!s.created_at || !goalMap.has(s.goal_id)) continue
    // El tiempo de la sesión en curso se cuenta en vivo (igual que en los totales)
    let secs = s.elapsed_seconds || 0
    if (s.is_active && s.started_at) {
      secs += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
    }
    if (secs <= 0) continue
    const d = new Date(s.created_at)
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = byDate[localDate] || (byDate[localDate] = {})
    const a = day[s.goal_id] || { secs: 0, count: 0 }
    a.secs += secs
    a.count += 1
    day[s.goal_id] = a
  }

  return Object.entries(byDate)
    .map(([date, goalsAgg]) => {
      const items: DateHistoryItem[] = Object.entries(goalsAgg)
        .filter(([, v]) => v.secs > 0)
        .map(([goalId, v]) => {
          const g = goalMap.get(goalId)!
          return { id: g.id, title: g.title, color: g.color, type: g.type, totalSeconds: v.secs, sessions: v.count }
        })
        .sort((a, b) => b.totalSeconds - a.totalSeconds)
      return { date, totalSeconds: items.reduce((acc, i) => acc + i.totalSeconds, 0), items }
    })
    .filter(d => d.items.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function getHabitConsistency(userId: string): Promise<HabitConsistency[]> {
  const supabase = createClient()
  const totalDays = 30

  const since = new Date()
  since.setDate(since.getDate() - totalDays)

  const [{ data: habits }, { data: allLogs }] = await Promise.all([
    supabase.from('goals').select('id, title, color').eq('user_id', userId).eq('type', 'habit').eq('archived', false),
    supabase.from('habit_logs').select('goal_id, logged_date').eq('user_id', userId).gte('logged_date', since.toISOString().split('T')[0]),
  ])

  if (!habits) return []

  const logsByGoal: Record<string, number> = {}
  for (const log of allLogs || []) {
    logsByGoal[log.goal_id] = (logsByGoal[log.goal_id] || 0) + 1
  }

  return habits
    .map(h => ({
      ...h,
      completedDays: logsByGoal[h.id] || 0,
      totalDays,
      pct: Math.round(((logsByGoal[h.id] || 0) / totalDays) * 100),
    }))
    .sort((a, b) => b.pct - a.pct)
}