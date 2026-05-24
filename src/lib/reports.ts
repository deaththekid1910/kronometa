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