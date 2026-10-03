'use client'

import { currentStreak, lastDays } from '@/lib/dates'

interface Props {
  logs: { logged_date: string }[]
  color: string
}

// Cuadrícula de las últimas 2 semanas + racha actual (fechas locales)
export default function HabitStreak({ logs, color }: Props) {
  const logDates = new Set(logs.map(l => l.logged_date))
  const days     = lastDays(logDates, 14)
  const streak   = currentStreak(logDates)
  const doneIn14 = days.filter(d => d.done).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 600 }}>ÚLTIMAS 2 SEMANAS</span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
          🔥 {streak} {streak === 1 ? 'día' : 'días'} de racha
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
        {days.map(day => (
          <div key={day.key}
            title={day.date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '100%', aspectRatio: '1', maxWidth: '40px',
              borderRadius: '6px',
              background: day.done ? color : 'var(--border)',
              boxShadow: day.done ? `0 0 6px ${color}66` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontFamily: 'var(--font-mono)',
              color: day.done ? '#0A0E1A' : 'var(--muted)', fontWeight: 600,
              transition: 'all 0.3s',
            }}>
              {day.date.getDate()}
            </div>
            <span style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {day.date.toLocaleDateString('es-VE', { weekday: 'narrow' })}
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'right' }}>
        {doneIn14} de 14 días cumplidos
      </div>
    </div>
  )
}
