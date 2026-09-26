import { create } from 'zustand'
import { TimerSession } from '@/types'
import { getActiveSessions } from '@/lib/timer'
import { createClient } from '@/lib/supabase'

// Varias metas/hábitos pueden tener su cronómetro corriendo a la vez: guardamos
// la sesión activa de cada uno indexada por goal_id. Un único intervalo global
// actualiza `now` cada segundo mientras haya al menos una sesión activa; cada
// widget calcula su tiempo con getElapsedSeconds(sesión).
interface TimerStore {
  sessions: Record<string, TimerSession>
  now: number
  loaded: boolean
  intervalId: ReturnType<typeof setInterval> | null
  loadActiveSessions: (force?: boolean) => Promise<void>
  setSession: (goalId: string, session: TimerSession | null) => void
  reset: () => void
}

let loadingPromise: Promise<void> | null = null

export const useTimerStore = create<TimerStore>((set, get) => {
  function syncTicking() {
    const { sessions, intervalId } = get()
    const running = Object.keys(sessions).length > 0
    if (running && !intervalId) {
      const id = setInterval(() => set({ now: Date.now() }), 1000)
      set({ intervalId: id, now: Date.now() })
    } else if (!running && intervalId) {
      clearInterval(intervalId)
      set({ intervalId: null })
    }
  }

  return {
    sessions: {},
    now: Date.now(),
    loaded: false,
    intervalId: null,

    // Carga las sesiones activas del usuario una sola vez (todas las tarjetas
    // comparten la misma petición). `force` vuelve a consultar, p.ej. al volver
    // a la pestaña por si se inició/detuvo un cronómetro en otro dispositivo.
    loadActiveSessions: async (force = false) => {
      if (get().loaded && !force) return
      if (loadingPromise) return loadingPromise
      loadingPromise = (async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const active = await getActiveSessions(user.id)
        const sessions: Record<string, TimerSession> = {}
        for (const s of active) sessions[s.goal_id] = s
        set({ sessions, loaded: true, now: Date.now() })
        syncTicking()
      })().finally(() => { loadingPromise = null })
      return loadingPromise
    },

    setSession: (goalId, session) => {
      const sessions = { ...get().sessions }
      if (session && session.is_active) sessions[goalId] = session
      else delete sessions[goalId]
      set({ sessions, now: Date.now() })
      syncTicking()
    },

    reset: () => {
      const { intervalId } = get()
      if (intervalId) clearInterval(intervalId)
      set({ sessions: {}, intervalId: null, loaded: false })
    },
  }
})
