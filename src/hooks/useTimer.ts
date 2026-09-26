'use client'

import { useEffect, useState } from 'react'
import { useTimerStore } from '@/store/timerStore'
import { startTimer, pauseTimer, getElapsedSeconds } from '@/lib/timer'
import { createClient } from '@/lib/supabase'

export function useTimer(goalId?: string) {
  const session            = useTimerStore(s => (goalId ? s.sessions[goalId] : undefined))
  const loadActiveSessions = useTimerStore(s => s.loadActiveSessions)
  const setSession         = useTimerStore(s => s.setSession)
  // Suscribirse a `now` hace que el widget se repinte cada segundo mientras corre
  useTimerStore(s => (session ? s.now : 0))
  const [busy, setBusy] = useState(false)

  const isActive = !!session?.is_active

  useEffect(() => { loadActiveSessions() }, [loadActiveSessions])

  async function handleStart() {
    if (!goalId || busy) return
    setBusy(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const created = await startTimer(goalId, user.id)
      if (created) setSession(goalId, created)
    } finally {
      setBusy(false)
    }
  }

  async function handlePause() {
    if (!goalId || !session || busy) return
    setBusy(true)
    try {
      const updated = await pauseTimer(session.id)
      if (updated) setSession(goalId, null)
    } finally {
      setBusy(false)
    }
  }

  return {
    isActive,
    busy,
    currentSeconds: session ? getElapsedSeconds(session) : 0,
    activeSession: session ?? null,
    handleStart,
    handlePause,
  }
}
