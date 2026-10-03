'use client'

import { formatTime } from '@/lib/timer'
import { Panel } from '@/components/ui/Layout'
import { Target, Repeat2, History } from 'lucide-react'

export interface RecentSessionItem {
  id: string
  goalTitle: string
  goalColor: string
  goalType: string
  seconds: number
  date: string   // ISO
}

interface Props { sessions: RecentSessionItem[]; isMobile?: boolean }

export default function RecentSessions({ sessions, isMobile = false }: Props) {
  return (
    <Panel icon={<History size={14} />} title="Sesiones recientes" color="var(--cyan)" isMobile={isMobile}>
      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.25rem 1rem', color: 'var(--muted)', fontSize: '13px' }}>
          Aún no registras sesiones de cronómetro.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {sessions.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                background: `${s.goalColor}18`, border: `1px solid ${s.goalColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.goalColor,
              }}>
                {s.goalType === 'habit' ? <Repeat2 size={14} /> : <Target size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                  {s.goalTitle}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {new Date(s.date).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}{s.goalType === 'habit' ? 'Hábito' : 'Meta'}
                </div>
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: s.goalColor, fontWeight: 600, flexShrink: 0 }}>
                {formatTime(s.seconds)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
