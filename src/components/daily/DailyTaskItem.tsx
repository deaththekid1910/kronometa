'use client'

import { useState } from 'react'
import { DailyTask } from '@/types/dailyTask'
import { createClient } from '@/lib/supabase'
import { formatTaskDate } from '@/lib/dailyTasks'
import { playCompleteSound } from '@/lib/notificationSound'
import { DAILY_TASK_XP } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { Check, Clock, Pencil, Trash2, RotateCcw, CalendarClock } from 'lucide-react'
import EditDailyTaskModal from './EditDailyTaskModal'
import { chip, actionBtn } from '@/components/ui/Layout'

interface Props {
  task: DailyTask
  color: string
  overdue?: boolean
  onComplete:   (id: string) => void
  onUncomplete: (id: string) => void
  onUpdate:     (task: DailyTask) => void
  onDelete:     (id: string) => void
}

export default function DailyTaskItem({
  task, color, overdue,
  onComplete, onUncomplete, onUpdate, onDelete,
}: Props) {
  const [loading,    setLoading]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const { addXP } = useXPStore()
  const done = !!task.completed_at

  async function toggleComplete() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    const newVal = done ? null : new Date().toISOString()
    await supabase.from('daily_tasks').update({ completed_at: newVal }).eq('id', task.id)
    if (done) {
      addXP(-DAILY_TASK_XP)
      onUncomplete(task.id)
    } else {
      addXP(DAILY_TASK_XP)
      playCompleteSound()
      onComplete(task.id)
    }
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('daily_tasks').delete().eq('id', task.id)
    if (done) addXP(-DAILY_TASK_XP) // recupera el XP de una tarea ya completada
    onDelete(task.id)
    setLoading(false)
  }

  const hasMeta = !!task.reminder_time || done || overdue

  return (
    <>
      <div style={{
        borderRadius: 'var(--radius-md)',
        background: done ? `${color}08` : 'var(--surface2)',
        border: `1px solid ${done ? color + '30' : overdue ? '#FFB80033' : 'var(--border)'}`,
        transition: 'all 0.3s ease',
        opacity: done ? 0.8 : 1,
        overflow: 'hidden',
      }}>

        {/* CUERPO: casilla + título y nota */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px 12px' }}>
          <button
            onClick={toggleComplete}
            disabled={loading}
            title={done ? 'Desmarcar' : 'Marcar como lista'}
            aria-label={done ? 'Desmarcar tarea' : 'Marcar tarea como lista'}
            style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${done ? color : overdue ? '#FFB80088' : 'var(--muted)'}`,
              background: done ? color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: done ? `0 0 8px ${color}66` : 'none',
              marginTop: '1px',
            }}
          >
            {done && <Check size={13} color="#0A0E1A" strokeWidth={3} />}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: '14px', fontWeight: 500, display: 'block',
              color: done ? 'var(--muted)' : 'var(--text)',
              textDecoration: done ? 'line-through' : 'none',
              transition: 'all 0.3s',
              lineHeight: 1.4, overflowWrap: 'anywhere',
            }}>
              {task.title}
            </span>

            {task.description && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* PIE: datos de la tarea a la izquierda, acciones a la derecha */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '10px', flexWrap: 'wrap',
          padding: '8px 12px 8px 52px',
          borderTop: '1px solid var(--border)',
          background: '#0A0E1A55',
          minHeight: '44px', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
            {task.reminder_time && (
              <span style={chip('#00F5FF')}>
                <Clock size={11} />
                <span style={{ fontFamily: 'var(--font-mono)' }}>{task.reminder_time.slice(0, 5)}</span>
              </span>
            )}
            {overdue && (
              <span style={chip('#FFB800')}>
                <CalendarClock size={11} />
                {formatTaskDate(task.task_date)}
              </span>
            )}
            {done && (
              <span style={{ ...chip(color), fontFamily: 'var(--font-mono)' }}>
                +{DAILY_TASK_XP} XP
              </span>
            )}
            {!hasMeta && (
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Sin recordatorio</span>
            )}
          </div>

          {confirmDel ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '12px', color: 'var(--text)' }}>¿Eliminar?</span>
              <button onClick={handleDelete} disabled={loading} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--red)', border: 'none',
                color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
              }}>
                {loading ? '...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
              }}>
                No
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {done && (
                <button onClick={toggleComplete} disabled={loading} title="Desmarcar" aria-label="Desmarcar tarea" style={actionBtn('#FFB800')}>
                  <RotateCcw size={13} />
                </button>
              )}
              <button onClick={() => setShowEdit(true)} title="Editar" aria-label="Editar tarea" style={actionBtn(done ? color : '#00F5FF')}>
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDel(true)} title="Eliminar" aria-label="Eliminar tarea" style={actionBtn('#FF3860')}>
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditDailyTaskModal
            task={task}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </div>
      )}
    </>
  )
}

