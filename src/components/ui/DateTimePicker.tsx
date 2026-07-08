'use client'

import { useMemo } from 'react'
import { localTimezone } from '@/lib/schedule'
import { useCountdownTicker } from '@/hooks/useCountdownTicker'

interface Props {
  value: string | null              // ISO UTC string, o null si no hay fecha
  onChange: (isoUtc: string | null) => void
  color: string
}

// Convierte los valores locales de los inputs (date + time) a un ISO UTC.
// `new Date(y, m, d, h, mi, s)` construye la fecha en la zona horaria del
// NAVEGADOR (que es la del usuario) — al pedir .toISOString() obtenemos UTC
// automáticamente, sin necesidad de librerías de timezone.
function localPartsToUtcIso(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null
  const [y, m, d]       = dateStr.split('-').map(Number)
  const [h, mi, s = '0'] = (timeStr || '00:00:00').split(':')
  const dt = new Date(y, (m || 1) - 1, d || 1, Number(h) || 0, Number(mi) || 0, Number(s) || 0)
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString()
}

function utcIsoToLocalParts(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return { date: '', time: '' }
  const y  = dt.getFullYear()
  const m  = String(dt.getMonth() + 1).padStart(2, '0')
  const d  = String(dt.getDate()).padStart(2, '0')
  const h  = String(dt.getHours()).padStart(2, '0')
  const mi = String(dt.getMinutes()).padStart(2, '0')
  const s  = String(dt.getSeconds()).padStart(2, '0')
  return { date: `${y}-${m}-${d}`, time: `${h}:${mi}:${s}` }
}

const QUICK_OPTIONS: { label: string; apply: () => Date }[] = [
  { label: 'En 1h',       apply: () => new Date(Date.now() + 60 * 60 * 1000) },
  { label: 'En 3h',       apply: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
  { label: 'Mañana 9:00', apply: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d } },
  { label: 'En 1 semana', apply: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d } },
  { label: 'En 1 mes',    apply: () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d } },
]

export default function DateTimePicker({ value, onChange, color }: Props) {
  const { date, time } = utcIsoToLocalParts(value)
  const tz  = useMemo(() => localTimezone(), [])
  const now = useCountdownTicker()

  function setDate(d: string) {
    onChange(localPartsToUtcIso(d, time || '23:59:00'))
  }
  function setTime(t: string) {
    if (!date) return
    onChange(localPartsToUtcIso(date, t))
  }
  function applyQuick(apply: () => Date) {
    onChange(apply().toISOString())
  }
  function clear() {
    onChange(null)
  }

  const targetMs   = value ? new Date(value).getTime() : null
  const isPast     = targetMs !== null && targetMs < now
  const isSoon     = targetMs !== null && !isPast && targetMs - now < 5 * 60 * 1000

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-mono)', colorScheme: 'dark',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 140px' }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <input
          type="time"
          step={1}
          value={time}
          disabled={!date}
          onChange={e => setTime(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 110px', opacity: date ? 1 : 0.5 }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {value && (
          <button type="button" onClick={clear} style={{
            padding: '0 12px', background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
          }}>
            Quitar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {QUICK_OPTIONS.map(opt => (
          <button
            key={opt.label}
            type="button"
            onClick={() => applyQuick(opt.apply)}
            style={{
              padding: '5px 10px', borderRadius: '20px',
              background: `${color}12`, border: `1px solid ${color}30`,
              color, fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value && !Number.isNaN(new Date(value).getTime()) && (
        <div style={{
          fontSize: '11px', color: isPast ? 'var(--red)' : 'var(--muted)',
          background: isPast ? '#FF386010' : `${color}08`,
          border: `1px solid ${isPast ? '#FF386030' : color + '22'}`,
          borderRadius: 'var(--radius-sm)', padding: '8px 12px', lineHeight: 1.5,
        }}>
          {isPast ? '⚠️ Esta fecha ya pasó. ' : isSoon ? '⚠️ Es una fecha muy próxima. ' : ''}
          Vencerá el{' '}
          <strong>
            {new Date(value).toLocaleString('es-VE', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            })}
          </strong>{' '}
          · zona horaria {tz}
        </div>
      )}
    </div>
  )
}
