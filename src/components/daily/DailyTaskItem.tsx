'use client'

import { useState } from 'react'
import { DailyTask } from '@/types/dailyTask'
import { createClient } from '@/lib/supabase'
import { formatTaskDate } from '@/lib/dailyTasks'
import { playCompleteSound } from '@/lib/notificationSound'
import { Check, Clock, Pencil, Trash2, RotateCcw, CalendarClock } from 'lucide-react'
import EditDailyTaskModal from './EditDailyTaskModal'

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
  const done = !!task.completed_at

  async function toggleComplete() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    const newVal = done ? null : new Date().toISOString()
    await supabase.from('daily_tasks').update({ completed_at: newVal }).eq('id', task.id)
    if (done) {
      onUncomplete(task.id)
    } else {
      playCompleteSound()
      onComplete(task.id)
    }
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('daily_tasks').delete().eq('id', task.id)
    onDelete(task.id)
    setLoading(false)
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: done ? `${color}08` : 'var(--surface)',
        border: `1px solid ${done ? color + '30' : overdue ? '#FFB80033' : 'var(--border)'}`,
        transition: 'all 0.3s ease',
        opacity: done ? 0.75 : 1,
      }}>

        {/* CHECKBOX */}
        <button
          onClick={toggleComplete}
          disabled={loading}
          title={done ? 'Desmarcar' : 'Marcar como lista'}
          style={{
            width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
            border: `2px solid ${done ? color : 'var(--dim)'}`,
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

        {/* CONTENIDO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '14px', fontWeight: 500, display: 'block',
            color: done ? 'var(--muted)' : 'var(--text)',
            textDecoration: done ? 'line-through' : 'none',
            transition: 'all 0.3s',
            overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {task.title}
          </span>

          {task.description && (
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
            {task.reminder_time && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)', background: '#00F5FF10',
                border: '1px solid #00F5FF22', padding: '1px 8px', borderRadius: '20px',
              }}>
                <Clock size={11} />
                {task.reminder_time.slice(0, 5)}
              </span>
            )}
            {overdue && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: 'var(--amber)',
                background: '#FFB80012', border: '1px solid #FFB80030',
                padding: '1px 8px', borderRadius: '20px',
              }}>
                <CalendarClock size={11} />
                {formatTaskDate(task.task_date)}
              </span>
            )}
          </div>

          {/* CONFIRM ELIMINAR */}
          {confirmDel && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FF386010', border: '1px solid #FF386030', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                ¿Eliminar esta tarea?
              </span>
              <button onClick={handleDelete} disabled={loading} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'var(--red)', border: 'none',
                color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
              }}>
                {loading ? '...' : 'Sí'}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
              }}>
                No
              </button>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        {!confirmDel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            {done && (
              <button
                onClick={toggleComplete}
                title="Desmarcar"
                style={iconBtn}
                onMouseEnter={e => hoverIcon(e, '#FFB800')}
                onMouseLeave={resetIcon}
              >
                <RotateCcw size={12} />
              </button>
            )}
            <button
              onClick={() => setShowEdit(true)}
              title="Editar"
              style={iconBtn}
              onMouseEnter={e => hoverIcon(e, color)}
              onMouseLeave={resetIcon}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              title="Eliminar"
              style={iconBtn}
              onMouseEnter={e => hoverIcon(e, '#FF3860')}
              onMouseLeave={resetIcon}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
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

const iconBtn: React.CSSProperties = {
  width: '26px', height: '26px', borderRadius: '6px',
  background: 'transparent', border: '1px solid transparent',
  color: 'var(--dim)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all var(--transition)',
}

function hoverIcon(e: React.MouseEvent<HTMLButtonElement>, c: string) {
  e.currentTarget.style.background = `${c}15`
  e.currentTarget.style.borderColor = `${c}33`
  e.currentTarget.style.color = c
}

function resetIcon(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.background = 'transparent'
  e.currentTarget.style.borderColor = 'transparent'
  e.currentTarget.style.color = 'var(--dim)'
}
