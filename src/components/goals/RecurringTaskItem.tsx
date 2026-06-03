'use client'

import { useState } from 'react'
import { RecurringTask, RecurringTaskWithLogs } from '@/types/recurring'
import { createClient } from '@/lib/supabase'
import { Repeat2, Calendar, Flame, Check, Trash2, ChevronDown, ChevronUp, Pencil, Clock, GripVertical } from 'lucide-react'
import EditRecurringTaskModal from './EditRecurringTaskModal'

interface Props {
  task: RecurringTaskWithLogs
  userId: string
  onLog:       (taskId: string) => void
  onDelete:    (taskId: string) => void
  onUpdate:    (updated: RecurringTask) => void
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: () => void
  onDragOver?:  () => void
  onDrop?:      () => void
  onDragEnd?:   () => void
}

export default function RecurringTaskItem({
  task, userId, onLog, onDelete, onUpdate,
  isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
}: Props) {
  const [logging,    setLogging]    = useState(false)
  const [expanded,   setExpanded]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)
  const [notes,      setNotes]      = useState('')

  const today     = new Date().toISOString().split('T')[0]
  const doneToday = !!task.todayLog
  const isExpired = task.deadline < today
  const color     = task.color

  const daysTotal = Math.max(1, Math.ceil(
    (new Date(task.deadline).getTime() - new Date(task.created_at).getTime()) / 86400000
  ))
  const daysDone = task.logs.length
  const pct      = Math.min(100, Math.round((daysDone / daysTotal) * 100))

  async function handleLog() {
    if (doneToday || logging || isExpired) return
    setLogging(true)
    const supabase = createClient()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    await supabase.from('recurring_task_logs').upsert({
      task_id:     task.id,
      user_id:     userId,
      logged_date: today,
      count:       task.target_count,
      notes:       notes.trim() || null,
      timezone,
    })
    onLog(task.id)
    setNotes('')
    setLogging(false)
  }

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('recurring_tasks').update({ archived: true }).eq('id', task.id)
    onDelete(task.id)
  }

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={e => { e.preventDefault(); onDragOver?.() }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
          background: 'var(--surface)',
          border: `1px solid ${isDragOver ? color : doneToday ? color + '44' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          transition: 'all 0.2s',
          opacity: isDragging ? 0.35 : (isExpired && !doneToday ? 0.7 : 1),
          boxShadow: isDragOver ? `0 0 0 1px ${color}55, 0 6px 20px ${color}18` : 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}>

        {/* BARRA PROGRESO */}
        <div style={{ height: '2px', background: 'var(--border)' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: 'width 0.6s ease',
          }} />
        </div>

        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

            {/* GRIP */}
            <div style={{
              display: 'flex', alignItems: 'center', flexShrink: 0,
              color: 'var(--dim)', marginTop: '8px', opacity: 0.35,
              pointerEvents: 'none',
            }}>
              <GripVertical size={14} />
            </div>

            {/* BOTÓN MARCAR */}
            <button
              onClick={handleLog}
              disabled={doneToday || logging || isExpired}
              style={{
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${doneToday ? color : 'var(--dim)'}`,
                background: doneToday ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: doneToday || isExpired ? 'default' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: doneToday ? `0 0 10px ${color}66` : 'none',
                marginTop: '2px',
              }}
            >
              {doneToday
                ? <Check size={15} color="#0A0E1A" strokeWidth={3} />
                : <Repeat2 size={14} color="var(--dim)" />
              }
            </button>

            {/* INFO */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: doneToday ? 'var(--muted)' : 'var(--text)' }}>
                  {task.title}
                </span>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                  background: color + '15', border: `1px solid ${color}30`,
                  color, flexShrink: 0, fontFamily: 'var(--font-mono)',
                }}>
                  ×{task.target_count}/día
                </span>
                {isExpired && (
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                    background: '#FF386015', border: '1px solid #FF386030',
                    color: 'var(--red)', flexShrink: 0,
                  }}>Finalizada</span>
                )}
                {doneToday && (
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                    background: color + '15', border: `1px solid ${color}30`,
                    color, flexShrink: 0,
                  }}>✓ Hecho hoy</span>
                )}
              </div>

              {task.description && (
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
                  {task.description}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--amber)' }}>
                  <Flame size={11} />
                  {task.streak}d racha
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--muted)' }}>
                  <Check size={11} />
                  {daysDone}/{daysTotal} días · {pct}%
                </span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px',
                  color: isExpired ? 'var(--red)' : 'var(--muted)',
                }}>
                  <Calendar size={11} />
                  {isExpired ? 'Venció' : 'Hasta'}{' '}
                  {new Date(task.deadline + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                </span>
                {!isExpired && (
                  <span style={{ fontSize: '11px', color }}>{task.daysRemaining}d restantes</span>

            
                )}
              </div>
            </div>

            {/* HORARIOS DE NOTIFICACIÓN */}
                  {Array.isArray(task.notification_times) && task.notification_times.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      <Clock size={10} color="var(--cyan)" />
                      {task.notification_times
                        .slice().sort((a: string, b: string) => a.localeCompare(b))
                        .map((t: string, i: number) => (
                          <span key={i} style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            color: 'var(--cyan)', background: '#00F5FF10',
                            border: '1px solid #00F5FF22',
                            padding: '1px 6px', borderRadius: '10px',
                          }}>{t}</span>
                        ))
                      }
                    </div>
                  )}

            {/* ACCIONES */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <button
                onClick={() => setExpanded(p => !p)}
                style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              <button
                onClick={() => setShowEdit(true)}
                title="Editar"
                style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  background: color + '12', border: `1px solid ${color}22`,
                  color, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all var(--transition)',
                }}
              >
                <Pencil size={12} />
              </button>

              <button
                onClick={() => setConfirmDel(true)}
                title="Eliminar"
                style={{
                  width: '26px', height: '26px', borderRadius: '6px',
                  background: '#FF386010', border: '1px solid #FF386022',
                  color: 'var(--red)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* CONFIRM ELIMINAR */}
          {confirmDel && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
              padding: '8px 12px', background: '#FF386010',
              border: '1px solid #FF386030', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                ¿Eliminar esta tarea recurrente?
              </span>
              <button onClick={handleDelete} style={{
                padding: '4px 12px', borderRadius: '6px',
                background: 'var(--red)', border: 'none',
                color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
              }}>Sí</button>
              <button onClick={() => setConfirmDel(false)} style={{
                padding: '4px 12px', borderRadius: '6px',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
              }}>No</button>
            </div>
          )}

          {/* EXPANDIDO */}
          {expanded && (
            <div style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              {!doneToday && !isExpired && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                    NOTA DE HOY (opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="¿Cómo fue hoy?"
                      onKeyDown={e => e.key === 'Enter' && handleLog()}
                      style={{
                        flex: 1, padding: '8px 12px',
                        background: '#1a1a2e', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                        fontSize: '13px', outline: 'none', fontFamily: 'var(--font-sans)',
                      }}
                      onFocus={e => e.target.style.borderColor = color}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button onClick={handleLog} disabled={logging} style={{
                      padding: '8px 16px', background: color, border: 'none',
                      borderRadius: 'var(--radius-sm)', color: '#0A0E1A',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      boxShadow: `0 0 12px ${color}44`,
                    }}>
                      {logging ? '...' : '✓ Marcar'}
                    </button>
                  </div>
                </div>
              )}

              {task.logs.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '8px' }}>
                    HISTORIAL RECIENTE
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {task.logs.slice(0, 14).map(log => (
                      <div key={log.id} title={`${log.logged_date}${log.notes ? ': ' + log.notes : ''}`} style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: color + '22', border: `1px solid ${color}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', color, fontFamily: 'var(--font-mono)',
                      }}>
                        {new Date(log.logged_date + 'T12:00:00').getDate()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditRecurringTaskModal
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