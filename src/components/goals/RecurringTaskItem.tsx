'use client'

import { useState } from 'react'
import { RecurringTask, RecurringTaskWithLogs } from '@/types/recurring'
import { createClient } from '@/lib/supabase'
import { Repeat2, Calendar, Flame, Check, Trash2, ChevronDown, ChevronUp, Pencil, Clock, GripVertical } from 'lucide-react'
import EditRecurringTaskModal from './EditRecurringTaskModal'
import { ItemFooter, InlineConfirm, chip, actionBtn, ModalBackdrop } from '@/components/ui/Layout'

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

  const times = Array.isArray(task.notification_times)
    ? task.notification_times.slice().sort((a: string, b: string) => a.localeCompare(b))
    : []

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={e => { e.preventDefault(); onDragOver?.() }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${isDragOver ? color : doneToday ? color + '44' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          transition: 'all 0.2s',
          opacity: isDragging ? 0.35 : (isExpired && !doneToday ? 0.7 : 1),
          boxShadow: isDragOver ? `0 0 0 1px ${color}55, 0 6px 20px ${color}18` : 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}>

        {/* BARRA PROGRESO */}
        <div style={{ height: '3px', background: 'var(--border)' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            transition: 'width 0.6s ease',
          }} />
        </div>

        {/* CUERPO: arrastre + marcar hoy + título */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px 12px 10px' }}>
          <div title="Arrastra para reordenar" style={{
            display: 'flex', alignItems: 'center', flexShrink: 0,
            color: 'var(--muted)', marginTop: '8px', opacity: 0.5,
          }}>
            <GripVertical size={14} />
          </div>

          <button
            onClick={handleLog}
            disabled={doneToday || logging || isExpired}
            title={doneToday ? 'Ya la marcaste hoy' : isExpired ? 'Finalizada' : 'Marcar hecha hoy'}
            aria-label={doneToday ? 'Hecha hoy' : 'Marcar hecha hoy'}
            style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${doneToday ? color : 'var(--muted)'}`,
              background: doneToday ? color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: doneToday || isExpired ? 'default' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: doneToday ? `0 0 10px ${color}66` : 'none',
            }}
          >
            {doneToday
              ? <Check size={15} color="#0A0E1A" strokeWidth={3} />
              : <Repeat2 size={14} color="var(--muted)" />
            }
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: doneToday ? 'var(--muted)' : 'var(--text)', lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                {task.title}
              </span>
              <span style={{ ...chip(color), fontFamily: 'var(--font-mono)', padding: '2px 8px' }}>×{task.target_count}/día</span>
              {isExpired && <span style={{ ...chip('#FF3860'), padding: '2px 8px' }}>Finalizada</span>}
              {doneToday && <span style={{ ...chip(color), padding: '2px 8px' }}>✓ Hecho hoy</span>}
            </div>
            {task.description && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* PIE: racha, avance, fecha y horarios · acciones */}
        <ItemFooter
          indent={52}
          meta={<>
            <span style={chip('#FFB800')}><Flame size={11} /> {task.streak}d racha</span>
            <span style={chip('#94A3B8')}><Check size={11} /> {daysDone}/{daysTotal} días · {pct}%</span>
            <span style={chip(isExpired ? '#FF3860' : '#94A3B8')}>
              <Calendar size={11} />
              {isExpired ? 'Venció' : 'Hasta'}{' '}
              {new Date(task.deadline + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              {!isExpired && ` · ${task.daysRemaining}d`}
            </span>
            {times.map((t: string, i: number) => (
              <span key={i} style={{ ...chip('#00F5FF'), fontFamily: 'var(--font-mono)' }}><Clock size={10} /> {t}</span>
            ))}
          </>}
          actions={confirmDel ? (
            <InlineConfirm text="¿Eliminar?" confirmLabel="Sí, eliminar"
              onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />
          ) : (<>
            <button onClick={() => setExpanded(p => !p)} aria-expanded={expanded}
              title={expanded ? 'Ocultar detalle' : 'Nota de hoy e historial'}
              aria-label={expanded ? 'Ocultar detalle' : 'Ver detalle'} style={actionBtn('#94A3B8')}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button onClick={() => setShowEdit(true)} title="Editar" aria-label="Editar tarea recurrente" style={actionBtn(color)}>
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDel(true)} title="Eliminar" aria-label="Eliminar tarea recurrente" style={actionBtn('#FF3860')}>
              <Trash2 size={13} />
            </button>
          </>)}
        />

        {/* EXPANDIDO */}
        {expanded && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
            {!doneToday && !isExpired && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  NOTA DE HOY (opcional)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="¿Cómo fue hoy?"
                    onKeyDown={e => e.key === 'Enter' && handleLog()}
                    style={{
                      flex: '1 1 180px', padding: '9px 12px',
                      background: '#1a1a2e', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                      fontSize: '13px', outline: 'none', fontFamily: 'var(--font-sans)',
                    }}
                    onFocus={e => e.target.style.borderColor = color}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button onClick={handleLog} disabled={logging} style={{
                    padding: '9px 16px', background: color, border: 'none',
                    borderRadius: 'var(--radius-sm)', color: '#0A0E1A',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: `0 0 12px ${color}44`,
                  }}>
                    {logging ? '...' : '✓ Marcar'}
                  </button>
                </div>
              </div>
            )}

            {task.logs.length > 0 ? (
              <div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '8px', fontWeight: 500 }}>
                  HISTORIAL RECIENTE
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {task.logs.slice(0, 14).map(log => (
                    <div key={log.id} title={`${log.logged_date}${log.notes ? ': ' + log.notes : ''}`} style={{
                      width: '30px', height: '30px', borderRadius: '6px',
                      background: color + '22', border: `1px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', color, fontFamily: 'var(--font-mono)',
                    }}>
                      {new Date(log.logged_date + 'T12:00:00').getDate()}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Aún no hay días registrados.</div>
            )}
          </div>
        )}
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <ModalBackdrop>
          <EditRecurringTaskModal
            task={task}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </ModalBackdrop>
      )}
    </>
  )
}
