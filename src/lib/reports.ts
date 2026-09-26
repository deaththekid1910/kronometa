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
  running?: boolean     // tiene un cronómetro corriendo ahora mismo
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

  // date -> goalId -> { secs, count, running }
  const byDate: Record<string, Record<string, { secs: number; count: number; running: boolean }>> = {}
  for (const s of sessions || []) {
    if (!s.created_at || !goalMap.has(s.goal_id)) continue
    // El tiempo de la sesión en curso se cuenta en vivo (igual que en los totales)
    let secs = s.elapsed_seconds || 0
    if (s.is_active && s.started_at) {
      secs += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
    }
    const running = !!(s.is_active && s.started_at)
    if (secs <= 0 && !running) continue
    const d = new Date(s.created_at)
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = byDate[localDate] || (byDate[localDate] = {})
    const a = day[s.goal_id] || { secs: 0, count: 0, running: false }
    a.secs += secs
    a.count += 1
    a.running = a.running || running
    day[s.goal_id] = a
  }

  return Object.entries(byDate)
    .map(([date, goalsAgg]) => {
      const items: DateHistoryItem[] = Object.entries(goalsAgg)
        .filter(([, v]) => v.secs > 0 || v.running)
        .map(([goalId, v]) => {
          const g = goalMap.get(goalId)!
          return { id: g.id, title: g.title, color: g.color, type: g.type, totalSeconds: v.secs, sessions: v.count, running: v.running }
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
// ─────────────────────────────────────────────────────────────────────────────
// REPORTES POR ÁREA
// Una sola consulta trae todo lo necesario y luego cada área (metas, hábitos,
// diarias, horario) calcula sus propios datos por separado, sin mezclarse.
// ─────────────────────────────────────────────────────────────────────────────

interface RawGoal    { id: string; title: string; color: string; type: string }
interface RawSession { goal_id: string; elapsed_seconds: number; created_at: string; started_at: string | null; is_active: boolean }
interface RawLog     { goal_id: string; logged_date: string }
interface RawSubGoal { goal_id: string; completed_at: string | null }
interface RawTask    { id: string; title: string; task_date: string; completed_at: string | null }
interface RawBlock   { id: string; title: string; color: string; days_of_week: number[]; start_time: string; end_time: string | null; active: boolean }

export interface ReportsData {
  goals:      RawGoal[]
  sessions:   RawSession[]
  habitLogs:  RawLog[]
  subGoals:   RawSubGoal[]
  dailyTasks: RawTask[]
  schedule:   RawBlock[]
  fetchedAt:  number
}

// Fecha local 'YYYY-MM-DD' de un Date (no UTC)
export function localDateOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getReportsData(userId: string): Promise<ReportsData> {
  const supabase = createClient()

  const since = new Date()
  since.setDate(since.getDate() - 60)
  const sinceDate = localDateOf(since)

  const { data: goals } = await supabase
    .from('goals').select('id, title, color, type')
    .eq('user_id', userId).eq('archived', false)

  const goalIds = (goals || []).map(g => g.id)

  // Las tablas opcionales (daily_tasks, schedule_blocks) pueden no existir aún:
  // en ese caso Supabase devuelve error y data nulo → se tratan como vacías.
  const [sessions, habitLogs, subGoals, dailyTasks, schedule] = await Promise.all([
    supabase.from('timer_sessions')
      .select('goal_id, elapsed_seconds, created_at, started_at, is_active')
      .eq('user_id', userId),
    supabase.from('habit_logs')
      .select('goal_id, logged_date')
      .eq('user_id', userId).gte('logged_date', sinceDate),
    goalIds.length
      ? supabase.from('sub_goals').select('goal_id, completed_at').in('goal_id', goalIds)
      : Promise.resolve({ data: [] as RawSubGoal[] }),
    supabase.from('daily_tasks')
      .select('id, title, task_date, completed_at')
      .eq('user_id', userId).gte('task_date', sinceDate),
    supabase.from('schedule_blocks')
      .select('id, title, color, days_of_week, start_time, end_time, active')
      .eq('user_id', userId),
  ])

  return {
    goals:      goals || [],
    sessions:   (sessions.data || []) as RawSession[],
    habitLogs:  (habitLogs.data || []) as RawLog[],
    subGoals:   (subGoals.data || []) as RawSubGoal[],
    dailyTasks: (dailyTasks.data || []) as RawTask[],
    schedule:   (schedule.data || []) as RawBlock[],
    fetchedAt:  Date.now(),
  }
}

function lastNDates(n: number): string[] {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(localDateOf(d))
  }
  return out
}

function shortWeekday(date: string): string {
  const l = new Date(date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', '')
  return l.charAt(0).toUpperCase() + l.slice(1)
}

function sessionSeconds(s: RawSession, now: number): number {
  let secs = s.elapsed_seconds || 0
  if (s.is_active && s.started_at) secs += Math.floor((now - new Date(s.started_at).getTime()) / 1000)
  return Math.max(0, secs)
}

export type TimedArea = 'goal' | 'habit'

// Tiempo total acumulado por cada meta o cada hábito (solo el área pedida)
export function timeByArea(data: ReportsData, area: TimedArea): GoalTimeData[] {
  const secs: Record<string, number> = {}
  for (const s of data.sessions) secs[s.goal_id] = (secs[s.goal_id] || 0) + sessionSeconds(s, data.fetchedAt)
  return data.goals
    .filter(g => g.type === area && (secs[g.id] || 0) > 0)
    .map(g => ({ ...g, totalSeconds: secs[g.id] }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
}

// Actividad de los últimos 7 días (fecha local) solo del área pedida
export function weeklyByArea(data: ReportsData, area: TimedArea): DayActivity[] {
  const ids = new Set(data.goals.filter(g => g.type === area).map(g => g.id))
  const agg: Record<string, { secs: number; count: number }> = {}
  for (const s of data.sessions) {
    if (!ids.has(s.goal_id) || !s.created_at) continue
    const date = localDateOf(new Date(s.created_at))
    const a = agg[date] || (agg[date] = { secs: 0, count: 0 })
    a.secs  += sessionSeconds(s, data.fetchedAt)
    a.count += 1
  }
  return lastNDates(7).map(date => ({
    date,
    label: shortWeekday(date),
    seconds: agg[date]?.secs || 0,
    sessions: agg[date]?.count || 0,
  }))
}

// Consistencia de hábitos en los últimos 30 días (días distintos registrados)
export function habitConsistencyOf(data: ReportsData, totalDays = 30): HabitConsistency[] {
  const inWindow = new Set(lastNDates(totalDays))
  const days: Record<string, Set<string>> = {}
  for (const l of data.habitLogs) {
    if (!inWindow.has(l.logged_date)) continue
    if (!days[l.goal_id]) days[l.goal_id] = new Set()
    days[l.goal_id].add(l.logged_date)
  }
  return data.goals
    .filter(g => g.type === 'habit')
    .map(h => {
      const completedDays = days[h.id]?.size || 0
      return { ...h, completedDays, totalDays, pct: Math.round((completedDays / totalDays) * 100) }
    })
    .sort((a, b) => b.pct - a.pct)
}

export interface GoalProgress {
  id: string
  title: string
  color: string
  completed: number
  total: number
  pct: number
}

// Avance de submetas por meta
export function goalProgressOf(data: ReportsData): GoalProgress[] {
  const agg: Record<string, { done: number; total: number }> = {}
  for (const sg of data.subGoals) {
    const a = agg[sg.goal_id] || (agg[sg.goal_id] = { done: 0, total: 0 })
    a.total += 1
    if (sg.completed_at) a.done += 1
  }
  return data.goals
    .filter(g => g.type === 'goal')
    .map(g => {
      const a = agg[g.id] || { done: 0, total: 0 }
      return {
        id: g.id, title: g.title, color: g.color,
        completed: a.done, total: a.total,
        pct: a.total > 0 ? Math.round((a.done / a.total) * 100) : 0,
      }
    })
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
}

export interface DailyTaskDay {
  date: string
  label: string
  completed: number
  pending: number
}

export interface DailyTaskStats {
  days: DailyTaskDay[]      // últimos N días, del más antiguo al más reciente
  completed: number         // completadas en la ventana
  pending: number           // sin completar en la ventana
  rate: number              // % de cumplimiento en la ventana
  todayCompleted: number
  todayTotal: number
  bestStreak: number        // días seguidos con todas sus tareas completadas
}

export function dailyTaskStatsOf(data: ReportsData, windowDays = 14): DailyTaskStats {
  const agg: Record<string, { done: number; total: number }> = {}
  for (const t of data.dailyTasks) {
    const a = agg[t.task_date] || (agg[t.task_date] = { done: 0, total: 0 })
    a.total += 1
    if (t.completed_at) a.done += 1
  }

  const days = lastNDates(windowDays).map(date => ({
    date,
    label: shortWeekday(date),
    completed: agg[date]?.done || 0,
    pending: (agg[date]?.total || 0) - (agg[date]?.done || 0),
  }))

  const completed = days.reduce((a, d) => a + d.completed, 0)
  const pending   = days.reduce((a, d) => a + d.pending, 0)
  const today     = days[days.length - 1]

  let best = 0, run = 0
  for (const d of days) {
    if (d.completed > 0 && d.pending === 0) { run++; best = Math.max(best, run) }
    else run = 0
  }

  return {
    days, completed, pending,
    rate: completed + pending > 0 ? Math.round((completed / (completed + pending)) * 100) : 0,
    todayCompleted: today.completed,
    todayTotal: today.completed + today.pending,
    bestStreak: best,
  }
}

export interface ScheduleBlockStat {
  id: string
  title: string
  color: string
  weeklyMinutes: number
  days: number
}

export interface ScheduleStats {
  blocks: ScheduleBlockStat[]                                    // minutos planificados por semana
  byWeekday: { day: number; label: string; minutes: number }[]   // Lunes → Domingo
  totalMinutes: number
  activeBlocks: number
}

function toMinutes(t: string | null): number {
  const [h, m] = (t || '0:0').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Tiempo PLANIFICADO en el horario (los bloques no registran tiempo real).
// Bloques sin hora de fin cuentan como 1 hora, igual que en el módulo Horario.
export function scheduleStatsOf(data: ReportsData): ScheduleStats {
  const LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const perDay = [0, 0, 0, 0, 0, 0, 0]
  const active = data.schedule.filter(b => b.active)

  const blocks = active
    .map(b => {
      const start = toMinutes(b.start_time)
      let end = b.end_time ? toMinutes(b.end_time) : start + 60
      if (end <= start) end += 24 * 60          // cruza la medianoche
      const dur  = end - start
      const days = b.days_of_week || []
      for (const d of days) perDay[d] += dur
      return { id: b.id, title: b.title, color: b.color, weeklyMinutes: dur * days.length, days: days.length }
    })
    .filter(b => b.weeklyMinutes > 0)
    .sort((a, b) => b.weeklyMinutes - a.weeklyMinutes)

  return {
    blocks,
    byWeekday: [1, 2, 3, 4, 5, 6, 0].map(d => ({ day: d, label: LABELS[d], minutes: perDay[d] })),
    totalMinutes: blocks.reduce((a, b) => a + b.weeklyMinutes, 0),
    activeBlocks: active.length,
  }
}
