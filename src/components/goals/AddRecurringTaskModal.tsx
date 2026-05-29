'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { RecurringTask } from '@/types/recurring'
import { X, Repeat2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  goalId: string
  userId: string
  color: string
  onAdd: (task: RecurringTask) => void
  onClose: () => void
}

export default function AddRecurringTaskModal({ goalId, userId, color, onAdd, onClose }: Props) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [frequency,   setFrequency]   = useState<'daily' | 'weekly'>('daily')
  const [targetCount, setTargetCount] = useState(1)
  const [deadline,    setDeadline]    = useState('')
  const [loading,     setLoading]     = useState(false)

  async function handleAdd() {
    if (!title.trim() || !deadline) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_tasks')
      .insert({
        goal_id:      goalId,
        user_id:      userId,
        title:        title.trim(),
        description:  description.trim() || null,
        frequency,
        target_count: targetCount,
        deadline,
        color,
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
            <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Nueva tarea recurrente</h2>
            <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Se repite hasta la fecha límite
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
            placeholder="Ej: Crear 5 diseños para redes"
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

        {title && deadline && (
          <div style={{
            background: color + '10', border: `1px solid ${color}22`,
            borderRadius: 'var(--radius-sm)', padding: '10px 14px',
            fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6,
          }}>
            <span style={{ color }}>Resumen: </span>
            Debes realizar <strong style={{ color }}>{title}</strong>{' '}
            <strong style={{ color }}>{targetCount} {targetCount === 1 ? 'vez' : 'veces'}</strong>{' '}
            cada {frequency === 'daily' ? 'día' : 'semana'} hasta el{' '}
            <strong style={{ color }}>
              {new Date(deadline + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="primary" size="md"
            loading={loading}
            onClick={handleAdd}
            disabled={!title.trim() || !deadline}
            style={{ flex: 2, background: color, justifyContent: 'center' }}
          >
            Agregar tarea
          </Button>
        </div>
      </div>
    </div>
  )
}