'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DailyTask } from '@/types/dailyTask'
import { localToday, localTimezone } from '@/lib/dailyTasks'
import { X, ListChecks, Clock, Bell } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  userId: string
  color: string
  onAdd: (task: DailyTask) => void
  onClose: () => void
}

export default function AddDailyTaskModal({ userId, color, onAdd, onClose }: Props) {
  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [reminderOn,   setReminderOn]   = useState(false)
  const [reminderTime, setReminderTime] = useState('08:00')
  const [loading,      setLoading]      = useState(false)

  async function handleAdd() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('daily_tasks')
      .insert({
        user_id:       userId,
        title:         title.trim(),
        description:   description.trim() || null,
        reminder_time: reminderOn ? reminderTime : null,
        task_date:     localToday(),
        timezone:      localTimezone(),
      })
      .select()
      .single()

    if (data) onAdd(data)
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
      width: '100%', maxWidth: '440px',
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
            <ListChecks size={16} color={color} />
          </div>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Nueva tarea diaria</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Para tu lista de hoy
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
        {/* TÍTULO */}
        <div>
          <label style={labelStyle}>TAREA *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Hacer ejercicio 30 min"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <label style={labelStyle}>NOTA (opcional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Detalles..."
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* RECORDATORIO */}
        <div style={{
          background: '#0d1120', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={14} color={reminderOn ? 'var(--cyan)' : 'var(--dim)'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
                Recordatorio con sonido
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Te avisará hoy a la hora elegida
              </div>
            </div>
            <button
              onClick={() => setReminderOn(v => !v)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                background: reminderOn ? 'var(--cyan)' : 'var(--border)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s', flexShrink: 0,
                boxShadow: reminderOn ? '0 0 10px #00F5FF44' : 'none',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: reminderOn ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {reminderOn && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginTop: '12px', paddingTop: '12px',
              borderTop: '1px solid var(--border)',
            }}>
              <Clock size={14} color="var(--cyan)" />
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                Hora y minutos
              </span>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={{
                  padding: '6px 12px',
                  background: '#1a1a2e', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--cyan)',
                  fontSize: '14px', fontWeight: 600, outline: 'none',
                  colorScheme: 'dark', fontFamily: 'var(--font-mono)',
                  cursor: 'pointer', minWidth: '110px',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="primary" size="md"
            loading={loading}
            onClick={handleAdd}
            disabled={!title.trim()}
            style={{ flex: 2, background: color, justifyContent: 'center' }}
          >
            Agregar tarea
          </Button>
        </div>
      </div>
    </div>
  )
}
