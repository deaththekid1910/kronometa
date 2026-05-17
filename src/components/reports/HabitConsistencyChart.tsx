'use client'

import { HabitConsistency } from '@/lib/reports'

interface Props {
  data: HabitConsistency[]
}

export default function HabitConsistencyChart({ data }: Props) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin hábitos registrados aún.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {data.map(h => (
        <div key={h.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.color, boxShadow: `0 0 6px ${h.color}88` }} />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{h.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{h.completedDays}/{h.totalDays} días</span>
              <span style={{
                fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                color: h.pct >= 70 ? 'var(--green)' : h.pct >= 40 ? 'var(--amber)' : 'var(--red)',
              }}>
                {h.pct}%
              </span>
            </div>
          </div>
          <div style={{ height: '8px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${h.pct}%`,
              background: h.pct >= 70
                ? `linear-gradient(90deg, var(--green), #00FF8888)`
                : h.pct >= 40
                ? `linear-gradient(90deg, var(--amber), #FFB80088)`
                : `linear-gradient(90deg, var(--red), #FF386088)`,
              borderRadius: '8px',
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ display: 'flex', gap: '3px', marginTop: '6px', flexWrap: 'wrap' }}>
            {Array.from({ length: h.totalDays }).map((_, i) => {
              const d = new Date()
              d.setDate(d.getDate() - (h.totalDays - 1 - i))
              const key = d.toISOString().split('T')[0]
              return (
                <div key={key} title={key} style={{
                  width: '10px', height: '10px', borderRadius: '2px',
                  background: i < h.completedDays ? h.color : 'var(--border)',
                  opacity: i < h.completedDays ? 0.9 : 0.4,
                  transition: 'all 0.2s',
                }} />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}