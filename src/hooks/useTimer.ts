'use client'

import { useEffect } from 'react'
import { useTimerStore } from '@/store/timerStore'
import { startTimer, pauseTimer, getActiveSession } from '@/lib/timer'
import { createClient } from '@/lib/supabase'

export function useTimer(goalId?: string) {
  const { activeSession, currentSeconds, setActiveSession } = useTimerStore()
  const isActive = activeSession?.goal_id === goalId && activeSession?.is_active

  useEffect(() => {
    async function loadActiveSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const session = await getActiveSession(user.id)
      if (session) setActiveSession(session)
    }
    loadActiveSession()
  }, [])

  async function handleStart() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !goalId) return
    const session = await startTimer(goalId, user.id)
    if (session) setActiveSession(session)
  }

  async function handlePause() {
    if (!activeSession) return
    const updated = await pauseTimer(activeSession.id)
    if (updated) setActiveSession(null)
  }

  return {
    isActive,
    currentSeconds: isActive ? currentSeconds : 0,
    activeSession,
    handleStart,
    handlePause
  }
}