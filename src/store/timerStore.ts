import { create } from 'zustand'
import { TimerSession } from '@/types'
import { getElapsedSeconds } from '@/lib/timer'

interface TimerStore {
  activeSession: TimerSession | null
  currentSeconds: number
  intervalId: ReturnType<typeof setInterval> | null
  setActiveSession: (session: TimerSession | null) => void
  startTicking: () => void
  stopTicking: () => void
  reset: () => void
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeSession: null,
  currentSeconds: 0,
  intervalId: null,

  setActiveSession: (session) => {
    const { stopTicking } = get()
    stopTicking()
    if (session) {
      set({
        activeSession: session,
        currentSeconds: getElapsedSeconds(session)
      })
      get().startTicking()
    } else {
      set({ activeSession: null, currentSeconds: 0 })
    }
  },

  startTicking: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    const id = setInterval(() => {
      const { activeSession } = get()
      if (activeSession) {
        set({ currentSeconds: getElapsedSeconds(activeSession) })
      }
    }, 1000)
    set({ intervalId: id })
  },

  stopTicking: () => {
    const { intervalId } = get()
    if (intervalId) {
      clearInterval(intervalId)
      set({ intervalId: null })
    }
  },

  reset: () => {
    const { stopTicking } = get()
    stopTicking()
    set({ activeSession: null, currentSeconds: 0 })
  }
}))