import { createClient } from '@/lib/supabase'
import { TimerSession } from '@/types'

export function getElapsedSeconds(session: TimerSession): number {
  if (!session.is_active || !session.started_at) {
    return session.elapsed_seconds
  }
  const startedAt = new Date(session.started_at).getTime()
  const now = Date.now()
  return session.elapsed_seconds + Math.floor((now - startedAt) / 1000)
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export async function startTimer(goalId: string, userId: string): Promise<TimerSession | null> {
  const supabase = createClient()

  await supabase
    .from('timer_sessions')
    .update({ is_active: false, ended_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_active', true)

  const existingSession = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession.data) {
    const { data } = await supabase
      .from('timer_sessions')
      .update({
        is_active: true,
        started_at: new Date().toISOString(),
        ended_at: null
      })
      .eq('id', existingSession.data.id)
      .select()
      .single()
    return data
  }

  const { data } = await supabase
    .from('timer_sessions')
    .insert({
      goal_id: goalId,
      user_id: userId,
      started_at: new Date().toISOString(),
      elapsed_seconds: 0,
      is_active: true
    })
    .select()
    .single()

  return data
}

export async function pauseTimer(sessionId: string): Promise<TimerSession | null> {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const elapsed = getElapsedSeconds(session)

  const { data } = await supabase
    .from('timer_sessions')
    .update({
      is_active: false,
      elapsed_seconds: elapsed,
      started_at: null,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  return data
}

export async function getActiveSession(userId: string): Promise<TimerSession | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  return data
}

export async function getTotalSeconds(goalId: string): Promise<number> {
  const supabase = createClient()
  const { data } = await supabase
    .from('timer_sessions')
    .select('elapsed_seconds, started_at, is_active')
    .eq('goal_id', goalId)

  if (!data) return 0

  return data.reduce((total, session) => {
    return total + getElapsedSeconds(session as TimerSession)
  }, 0)
}