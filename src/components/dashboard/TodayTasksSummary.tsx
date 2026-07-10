'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { DailyTask } from '@/types/dailyTask'
import { Check, ListChecks } from 'lucide-react'

interface Props {
  tasks: DailyTask[]
  onToggled: (id: string) => void
}

export default function TodayTasksSummary({ tasks, onToggled }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function complete(id: string) {
    if (loadingId) return
    setLoadingId(id)
    const supabase = createClient()
    await supabase.from('daily_tasks').update({ completed_at: new Date().toISOString() }).eq('id', id)
    onToggled(id)
    setLoadingId(null)
  }

  return (
    <div className="km-card-appear" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ListChecks size={14} color="var(--cyan)" />
          <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
            TAREAS DE HOY
          </span>
        </div>
        <Link href="/daily" style={{ fontSize: '11px', color: 'var(--cyan)', textDecoration: 'none' }}>
          Ver todas →
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--dim)', fontSize: '13px' }}>
          Sin tareas pendientes por hoy. 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
              <button
                onClick={() => complete(t.id)}
                disabled={loadingId === t.id}
                title="Marcar como lista"
                style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  border: '2px solid var(--dim)', background: 'transparent',
                  cursor: loadingId === t.id ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {loadingId === t.id && <Check size={11} color="var(--dim)" />}
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.title}
              </span>
              {t.reminder_time && (
                <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {t.reminder_time.slice(0, 5)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
