'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function getBreakpoint(w: number): Breakpoint {
  if (w < 768)  return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('desktop')

  useEffect(() => {
    setBp(getBreakpoint(window.innerWidth))

    let timer: ReturnType<typeof setTimeout>
    function onResize() {
      clearTimeout(timer)
      timer = setTimeout(() => setBp(getBreakpoint(window.innerWidth)), 150)
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      clearTimeout(timer)
    }
  }, [])

  return bp
}

export function useIsMobile() { return useBreakpoint() === 'mobile' }
export function useIsTablet() { return useBreakpoint() === 'tablet' }