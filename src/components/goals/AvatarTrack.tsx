'use client'

import { SubGoal } from '@/types'

interface Props {
  subGoals: SubGoal[]
  color: string
}

export default function AvatarTrack({ subGoals, color }: Props) {
  const total     = subGoals.length
  const completed = subGoals.filter(sg => sg.completed_at).length
  const pct       = total > 0 ? (completed / total) * 100 : 0

  if (total === 0) return null

  return (
    <div style={{ padding: '24px 0 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '1px' }}>MAPA DE PROGRESO</span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color }}>
          {completed}/{total} submetas
        </span>
      </div>

      <div style={{ position: 'relative', height: '48px', margin: '0 10px' }}>
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: '3px', background: 'var(--border)',
          borderRadius: '3px', transform: 'translateY(-50%)',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}66, ${color})`,
            borderRadius: '3px', transition: 'width 0.8s ease',
          }} />
        </div>

        {subGoals.map((sg, i) => {
          const nodePct = total > 1 ? (i / (total - 1)) * 100 : 50
          const done    = !!sg.completed_at
          return (
            <div key={sg.id} style={{
              position: 'absolute', top: '50%',
              left: `${nodePct}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '6px', zIndex: 1,
            }}>
              <div style={{
                width: done ? '14px' : '10px',
                height: done ? '14px' : '10px',
                borderRadius: '50%',
                background: done ? color : 'var(--bg)',
                border: `2px solid ${done ? color : 'var(--dim)'}`,
                boxShadow: done ? `0 0 8px ${color}88` : 'none',
                transition: 'all 0.4s ease',
              }} />
            </div>
          )
        })}

        <div style={{
          position: 'absolute', top: '50%',
          left: `${pct}%`,
          transform: 'translate(-50%, -50%)',
          width: '28px', height: '28px', borderRadius: '50%',
          background: color,
          border: '3px solid var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', color: '#0A0E1A', fontWeight: 700,
          zIndex: 3,
          boxShadow: `0 0 16px ${color}99`,
          transition: 'left 0.8s ease',
        }}>★</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        {subGoals.map((sg, i) => (
          <div key={sg.id} style={{
            flex: 1, textAlign: 'center',
            fontSize: '10px',
            color: sg.completed_at ? color : 'var(--dim)',
            padding: '0 2px',
            transition: 'color 0.3s',
            maxWidth: `${100 / total}%`,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}