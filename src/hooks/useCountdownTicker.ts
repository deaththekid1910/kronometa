'use client'

import { useEffect } from 'react'
import { useTickerStore, subscribeTicker } from '@/store/tickerStore'

// Se suscribe al reloj compartido (un solo interval app-wide) y devuelve
// el timestamp `now` actual, actualizado cada segundo.
export function useCountdownTicker(): number {
  const now = useTickerStore(s => s.now)
  useEffect(() => subscribeTicker(), [])
  return now
}
