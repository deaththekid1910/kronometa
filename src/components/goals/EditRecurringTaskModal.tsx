'use client'

import { useState } from 'react'
import { RecurringTask } from '@/types/recurring'
import { createClient } from '@/lib/supabase'
import { X, Repeat2, Plus, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  task: RecurringTask
  color: string
  onSave: (updated: RecurringTask) => void
  onClose: () => void
}

export default function EditRecurringTaskModal({ task, color, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [frequency,   setFrequency]   = useState<'daily' | 'weekly'>(task.frequency)
  const [targetCount, setTargetCount] = useState(task.target_count)
  const [deadline,    setDeadline]    = useState(task.deadline)
  const [notifTimes,  setNotifTimes]  = useState<string[]>(
    Array.isArray(task.notification_times) && task.notification_times.length > 0
      ? task.notification_times
      : ['09:00']
  )
  const [loading, setLoading] = useState(false)

  function addNotifTime() {
    if (notifTimes.length >= 6) return
    setNotifTimes(prev => [...prev, '12:00'])
  }

  function removeNotifTime(i: number) {
    if (notifTimes.length <= 1) return
    setNotifTimes(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateNotifTime(i: number, val: string) {
    setNotifTimes(prev => prev.map((t, idx) => idx === i ? val : t))
  }

  async function handleSave() {
    if (!title.trim() || !deadline) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_tasks')
      .update({
        title:              title.trim(),
        description:        description.trim() || null,
        frequency,
        target_count:       targetCount,
        deadline,
        notification_times: notifTimes,
      })
      .eq('id', task.id)
      .select()
      .single()

    if (data) onSave(data)
    setLoading(false)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'var(--muted)',
    display: 'block', marginBottom: '6px', letterSpacing: '0.5px',
  }

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-xl)', padding: '24px',
      width: '100%', maxWidth: '460px',
      boxShadow: `0 0 40px ${color}18`,
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: color + '15', border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Repeat2 size={16} color={color} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Editar tarea recurrente</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Modifica los detalles de la tarea
            </p>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--dim)',
          cursor: 'pointer', padding: '4px', display: 'flex',
        }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        <div>
          <label style={labelStyle}>TÍTULO *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={labelStyle}>DESCRIPCIÓN (opcional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={labelStyle}>FRECUENCIA</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['daily', 'weekly'] as const).map(f => (
              <button key={f} onClick={() => setFrequency(f)} style={{
                flex: 1, padding: '9px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${frequency === f ? color : 'var(--border)'}`,
                background: frequency === f ? color + '15' : 'transparent',
                color: frequency === f ? color : 'var(--muted)',
                fontSize: '13px', cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}>
                {f === 'daily' ? '📅 Diaria' : '📆 Semanal'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>CANTIDAD OBJETIVO POR DÍA</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setTargetCount(Math.max(1, targetCount - 1))} style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>−</button>
            <span style={{
              fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color, minWidth: '40px', textAlign: 'center',
            }}>{targetCount}</span>
            <button onClick={() => setTargetCount(targetCount + 1)} style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: '18px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>+</button>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {targetCount === 1 ? 'vez por día' : 'veces por día'}
            </span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>FECHA LÍMITE *</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* HORARIOS DE NOTIFICACIÓN */}
        <div style={{
          background: '#0d1120', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Clock size={14} color="var(--cyan)" />
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
              Horarios de notificación diaria
            </span>
            <span style={{ fontSize: '11px', color: 'var(--dim)', marginLeft: 'auto' }}>
              {notifTimes.length}/6
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifTimes.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: color + '15', border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', fontWeight: 700, color,
                  fontFamily: 'var(--font-mono)',
                }}>{i + 1}</div>

                <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                  {i === 0 ? 'Primera notificación' : `Notificación ${i + 1}`}
                </span>

                <input
                  type="time"
                  value={t}
                  onChange={e => updateNotifTime(i, e.target.value)}
                  style={{
                    padding: '5px 10px',
                    background: '#1a1a2e', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color,
                    fontSize: '13px', fontWeight: 600, outline: 'none',
                    colorScheme: 'dark', fontFamily: 'var(--font-mono)',
                    minWidth: '100px',
                  }}
                  onFocus={e => e.target.style.borderColor = color}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />

                {notifTimes.length > 1 && (
                  <button onClick={() => removeNotifTime(i)} style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: '#FF386010', border: '1px solid #FF386022',
                    color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {notifTimes.length < 6 && (
            <button onClick={addNotifTime} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginTop: '8px', padding: '8px 12px', width: '100%',
              background: 'transparent', border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--muted)',
              fontSize: '12px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all var(--transition)',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = color
                ;(e.currentTarget as HTMLButtonElement).style.color = color
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
              }}
            >
              <Plus size={13} />
              Agregar otro horario
            </button>
          )}

          <div style={{
            marginTop: '10px', padding: '8px 12px',
            background: color + '08', border: `1px solid ${color}22`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Avisará a las:</span>
            {notifTimes
              .slice().sort((a, b) => a.localeCompare(b))
              .map((t, i) => (
                <span key={i} style={{
                  fontSize: '12px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', color,
                  background: color + '15', border: `1px solid ${color}30`,
                  padding: '2px 8px', borderRadius: '20px',
                }}>{t}</span>
              ))
            }
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="primary" size="md"
            loading={loading}
            onClick={handleSave}
            disabled={!title.trim() || !deadline}
            style={{ flex: 2, background: color, justifyContent: 'center' }}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}