import { create } from 'zustand'

interface TickerStore {
  now: number
  setNow: (n: number) => void
}

// Reloj compartido: un solo setInterval para todos los <Countdown> montados,
// en vez de uno por tarjeta (evita N timers redundantes en listados largos).
export const useTickerStore = create<TickerStore>((set) => ({
  now: Date.now(),
  setNow: (n) => set({ now: n }),
}))

let subscribers = 0
let intervalId: ReturnType<typeof setInterval> | null = null

function onVisibilityChange() {
  // Al recuperar el foco, resincroniza de inmediato con el reloj real en
  // vez de esperar al próximo tick (el intervalo estuvo pausado mientras
  // la pestaña estaba oculta).
  if (!document.hidden) useTickerStore.getState().setNow(Date.now())
}

export function subscribeTicker(): () => void {
  if (subscribers === 0) {
    intervalId = setInterval(() => {
      if (!document.hidden) useTickerStore.getState().setNow(Date.now())
    }, 1000)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
  subscribers++

  return () => {
    subscribers--
    if (subscribers <= 0) {
      subscribers = 0
      if (intervalId) clearInterval(intervalId)
      intervalId = null
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }
}
