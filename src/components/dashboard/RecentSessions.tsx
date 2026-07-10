'use client'

import { formatTime } from '@/lib/timer'
import { Target, Repeat2, History } from 'lucide-react'

export interface RecentSessionItem {
  id: string
  goalTitle: string
  goalColor: string
  goalType: string
  seconds: number
  date: string   // ISO
}

interface Props { sessions: RecentSessionItem[] }

export default function RecentSessions({ sessions }: Props) {
  return (
    <div className="km-card-appear" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <History size={14} color="var(--cyan)" />
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
          SESIONES RECIENTES
        </span>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--dim)', fontSize: '13px' }}>
          Aún no registras sesiones de cronómetro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                background: `${s.goalColor}18`, border: `1px solid ${s.goalColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.goalColor,
              }}>
                {s.goalType === 'habit' ? <Repeat2 size={14} /> : <Target size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.goalTitle}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--dim)' }}>
                  {new Date(s.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: s.goalColor, fontWeight: 600, flexShrink: 0 }}>
                {formatTime(s.seconds)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
