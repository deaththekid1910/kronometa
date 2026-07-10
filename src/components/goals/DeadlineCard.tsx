'use client'

import Countdown from './Countdown'

interface Props {
  deadline: string
  timezone: string
  createdAt: string
  color: string
  onClick?: () => void
}

export default function DeadlineCard({ deadline, timezone, createdAt, color, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      title={onClick ? 'Editar fecha límite' : undefined}
      style={{
        background: 'var(--surface)', border: `1px solid ${color}30`,
        borderRadius: 'var(--radius-lg)', padding: '18px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
      }}
      className="km-countdown-enter"
    >
      <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 700 }}>
        📅 FECHA DE VENCIMIENTO
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
        <span style={{ fontSize: '14px', color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>
          {new Date(deadline).toLocaleDateString('es-VE', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            timeZone: timezone,
          })}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          ⏰ {new Date(deadline).toLocaleTimeString('es-VE', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZone: timezone,
          })} ({timezone})
        </span>
      </div>

      <div style={{ width: '80%', height: '1px', background: 'var(--border)' }} />

      <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>
        ⏳ TIEMPO RESTANTE
      </span>
      <Countdown targetDate={deadline} startDate={createdAt} color={color} variant="default" size="lg" />
    </div>
  )
}
