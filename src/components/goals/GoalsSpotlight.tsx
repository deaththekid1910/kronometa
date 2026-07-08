'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoalWithStats } from '@/types'
import Countdown from './Countdown'
import { withAlpha } from '@/lib/colorPalette'
import { useCountdownTicker } from '@/hooks/useCountdownTicker'
import { ChevronLeft, ChevronRight, Play, ArrowRight } from 'lucide-react'

interface Props {
  goals: GoalWithStats[]
}

const WINDOW_DAYS = 7
const MAX_GOALS   = 5
const ROTATE_MS   = 8000

// Sección destacada del dashboard: metas próximas a vencer (≤7 días), con
// countdown "hero" y rotación automática si hay varias. No se muestra si
// ninguna meta está en ese rango.
export default function GoalsSpotlight({ goals }: Props) {
  const router = useRouter()
  const now    = useCountdownTicker()

  const urgent = useMemo(() => {
    const windowMs = WINDOW_DAYS * 86400000
    return goals
      .filter(g => g.type === 'goal' && g.deadline)
      .map(g => ({ goal: g, ms: new Date(g.deadline as string).getTime() - now }))
      .filter(x => x.ms > 0 && x.ms <= windowMs)
      .sort((a, b) => a.ms - b.ms)
      .slice(0, MAX_GOALS)
      .map(x => x.goal)
  }, [goals, now])

  const [index,  setIndex]  = useState(0)
  const [paused, setPaused] = useState(false)

  // Recorta el índice si la lista de metas urgentes se encoge (p.ej. una
  // venció y salió del rango) — sin esto, `index` podía apuntar fuera del
  // arreglo tras el recorte.
  if (index >= urgent.length && urgent.length > 0) {
    setIndex(0)
  }

  useEffect(() => {
    if (urgent.length <= 1 || paused) return
    const id = setInterval(() => setIndex(i => (i + 1) % urgent.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [urgent.length, paused])

  if (urgent.length === 0) return null

  const goal   = urgent[Math.min(index, urgent.length - 1)]
  const accent = goal.color

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="km-countdown-enter"
      style={{
        maxWidth: '800px', margin: '0 auto', width: '100%',
        background: `linear-gradient(160deg, ${withAlpha(accent, 0.12)}, ${withAlpha(accent, 0.03)})`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${withAlpha(accent, 0.3)}`,
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(20px, 4vw, 40px)',
        boxShadow: `0 8px 40px ${withAlpha(accent, 0.15)}`,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
        transition: 'background 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease',
      }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', fontWeight: 600 }}>
        🌍 MUNDOS POR CONQUISTAR
      </div>

      <div key={goal.id} className="km-countdown-enter" style={{ textAlign: 'center', width: '100%' }}>
        <h2 style={{ fontSize: 'clamp(16px, 2.4vw, 22px)', fontWeight: 600, margin: '0 0 18px', color: 'var(--text)' }}>
          🎯 {goal.title}
        </h2>
        <Countdown targetDate={goal.deadline} startDate={goal.created_at} color={accent} variant="hero" size="xl" />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => router.push(`/goals/${goal.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 18px', borderRadius: '999px',
          background: accent, border: 'none', color: '#0A0E1A',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          boxShadow: `0 0 16px ${withAlpha(accent, 0.5)}`,
        }}>
          <Play size={13} /> Trabajar ahora
        </button>
        <button onClick={() => router.push(`/goals/${goal.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '9px 18px', borderRadius: '999px',
          background: 'transparent', border: `1px solid ${withAlpha(accent, 0.4)}`, color: accent,
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        }}>
          Ver detalle <ArrowRight size={13} />
        </button>
      </div>

      {urgent.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setIndex(i => (i - 1 + urgent.length) % urgent.length)} style={arrowStyle} aria-label="Anterior">
            <ChevronLeft size={14} />
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            {urgent.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setIndex(i)}
                aria-label={`Ir a ${g.title}`}
                style={{
                  width: '7px', height: '7px', borderRadius: '50%', padding: 0, border: 'none',
                  background: i === index ? accent : 'var(--border)', cursor: 'pointer',
                  transition: 'background var(--transition)',
                }}
              />
            ))}
          </div>
          <button onClick={() => setIndex(i => (i + 1) % urgent.length)} style={arrowStyle} aria-label="Siguiente">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

const arrowStyle: React.CSSProperties = {
  width: '26px', height: '26px', borderRadius: '50%',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--muted)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0,
}
