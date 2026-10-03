'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { DailyTask } from '@/types/dailyTask'
import { DAILY_TASK_XP } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { playCompleteSound } from '@/lib/notificationSound'
import { Panel, PanelAction, chip } from '@/components/ui/Layout'
import { Check, ListChecks, Clock } from 'lucide-react'

interface Props {
  tasks: DailyTask[]
  completed: number
  pending: number
  isMobile?: boolean
  onToggled: (id: string) => void
}

export default function TodayTasksSummary({ tasks, completed, pending, isMobile = false, onToggled }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const addXP  = useXPStore(s => s.addXP)
  const router = useRouter()
  const total  = completed + pending
  const pct    = total > 0 ? Math.round((completed / total) * 100) : 0

  async function complete(id: string) {
    if (loadingId) return
    setLoadingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('daily_tasks').update({ completed_at: new Date().toISOString() }).eq('id', id)
    if (!error) {
      // Igual que en la página de Diarias: XP y sonido al completar
      addXP(DAILY_TASK_XP)
      playCompleteSound()
      onToggled(id)
    }
    setLoadingId(null)
  }

  return (
    <Panel
      icon={<ListChecks size={14} />} title="Tareas de hoy" color="var(--cyan)" isMobile={isMobile}
      subtitle={total > 0 ? `${completed} de ${total} completadas` : undefined}
      action={<PanelAction color="#00F5FF" onClick={() => router.push('/daily')}>Ver todas</PanelAction>}
    >
      {total > 0 && (
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#00F5FF88,#00F5FF)', transition: 'width 0.6s ease' }} />
        </div>
      )}

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.25rem 1rem', color: 'var(--muted)', fontSize: '13px' }}>
          {total > 0 ? '¡Todo listo por hoy! 🎉' : 'Sin tareas para hoy.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
            }}>
              <button
                onClick={() => complete(t.id)}
                disabled={loadingId === t.id}
                title={`Marcar como lista (+${DAILY_TASK_XP} XP)`}
                aria-label="Marcar tarea como lista"
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  border: '2px solid var(--muted)', background: 'transparent',
                  cursor: loadingId === t.id ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {loadingId === t.id && <Check size={12} color="var(--muted)" />}
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, minWidth: 0, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                {t.title}
              </span>
              {t.reminder_time && (
                <span style={{ ...chip('#00F5FF'), fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  <Clock size={10} /> {t.reminder_time.slice(0, 5)}
                </span>
              )}
            </div>
          ))}
          {pending > tasks.length && (
            <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center', paddingTop: '4px' }}>
              y {pending - tasks.length} más en Diarias
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
