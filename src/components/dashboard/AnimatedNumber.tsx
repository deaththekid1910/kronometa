'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTime } from '@/lib/timer'

type Format = 'number' | 'time' | 'percent'

interface Props {
  value: number
  duration?: number
  format?: Format
}

export default function AnimatedNumber({ value, duration = 1200, format = 'number' }: Props) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from  = fromRef.current
    const start = performance.now()

    let frame: number
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 4)   // easeOutQuart
      setDisplay(from + (value - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else { setDisplay(value); fromRef.current = value }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  if (format === 'time')    return <>{formatTime(Math.floor(display))}</>
  if (format === 'percent') return <>{Math.round(display)}%</>
  return <>{Math.floor(display).toLocaleString('es-VE')}</>
}
