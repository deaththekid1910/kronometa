'use client'

import { GoalProgress } from '@/lib/reports'
import { EmptyNote } from './ReportBlocks'

interface Props { data: GoalProgress[] }

// Avance de submetas por meta: cada meta con su barra y conteo
export default function GoalProgressList({ data }: Props) {
  if (data.length === 0) return <EmptyNote>Crea una meta con submetas para ver su avance.</EmptyNote>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map(g => (
        <div key={g.id} style={{ minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            gap: '10px', marginBottom: '6px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1 }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%', background: g.color,
                boxShadow: `0 0 6px ${g.color}`, flexShrink: 0, transform: 'translateY(-1px)',
              }} />
              <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                {g.title}
              </span>
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ color: 'var(--muted)' }}>{g.completed}/{g.total}</span>
              <span style={{ color: g.color, fontWeight: 600, marginLeft: '8px' }}>{g.pct}%</span>
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${g.pct}%`,
              background: `linear-gradient(90deg, ${g.color}66, ${g.color})`,
              borderRadius: '6px', boxShadow: `0 0 8px ${g.color}55`,
              transition: 'width 0.8s ease',
            }} />
          </div>
          {g.total === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Sin submetas todavía</div>
          )}
        </div>
      ))}
    </div>
  )
}
