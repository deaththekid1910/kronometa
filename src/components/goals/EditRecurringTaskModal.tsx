'use client'

import { useState } from 'react'
import { RecurringTask } from '@/types/recurring'
import { createClient } from '@/lib/supabase'
import { X, Repeat2 } from 'lucide-react'
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
  const [loading,     setLoading]     = useState(false)

  async function handleSave() {
    if (!title.trim() || !deadline) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_tasks')
      .update({
        title:        title.trim(),
        description:  description.trim() || null,
        frequency,
        target_count: targetCount,
        deadline,
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
      width: '100%', maxWidth: '440px',
      boxShadow: `0 0 40px ${color}18`,
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
            placeholder="Título de la tarea"
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
            placeholder="Detalles de la tarea..."
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
            <button
              onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
              style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{
              fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)',
              color, minWidth: '40px', textAlign: 'center',
            }}>{targetCount}</span>
            <button
              onClick={() => setTargetCount(targetCount + 1)}
              style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
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