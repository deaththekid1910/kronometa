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

  const { data: goals } = await supabase
    .from('goals')
    .select('id, title, color, type')
    .eq('user_id', userId)
    .eq('archived', false)

  if (!goals) return []

  const results: GoalTimeData[] = []

  for (const goal of goals) {
    const { data: sessions } = await supabase
      .from('timer_sessions')
      .select('elapsed_seconds, started_at, is_active')
      .eq('goal_id', goal.id)

    let total = 0
    for (const s of sessions || []) {
      if (s.is_active && s.started_at) {
        total += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
        total += s.elapsed_seconds
      } else {
        total += s.elapsed_seconds
      }
    }

    if (total > 0) {
      results.push({ ...goal, totalSeconds: total })
    }
  }

  return results.sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export async function getWeeklyActivity(userId: string): Promise<DayActivity[]> {
  const supabase = createClient()
  const days: DayActivity[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const label   = d.toLocaleDateString('es-VE', { weekday: 'short' })

    const start = `${dateStr}T00:00:00.000Z`
    const end   = `${dateStr}T23:59:59.999Z`

    const { data: sessions } = await supabase
      .from('timer_sessions')
      .select('elapsed_seconds, started_at, ended_at')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)

    const totalSecs = (sessions || []).reduce((acc, s) => acc + (s.elapsed_seconds || 0), 0)

    days.push({
      date: dateStr,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      seconds: totalSecs,
      sessions: (sessions || []).length,
    })
  }

  return days
}

export async function getHabitConsistency(userId: string): Promise<HabitConsistency[]> {
  const supabase = createClient()

  const { data: habits } = await supabase
    .from('goals')
    .select('id, title, color')
    .eq('user_id', userId)
    .eq('type', 'habit')
    .eq('archived', false)

  if (!habits) return []

  const results: HabitConsistency[] = []
  const totalDays = 30

  for (const habit of habits) {
    const since = new Date()
    since.setDate(since.getDate() - totalDays)

    const { data: logs } = await supabase
      .from('habit_logs')
      .select('logged_date')
      .eq('goal_id', habit.id)
      .gte('logged_date', since.toISOString().split('T')[0])

    const completedDays = logs?.length || 0
    results.push({
      ...habit,
      completedDays,
      totalDays,
      pct: Math.round((completedDays / totalDays) * 100),
    })
  }

  return results.sort((a, b) => b.pct - a.pct)
}