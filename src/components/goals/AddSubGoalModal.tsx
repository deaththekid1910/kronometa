'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SubGoal } from '@/types'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  goalId: string
  currentCount: number
  color: string
  onAdd: (subGoal: SubGoal) => void
  onClose: () => void
}

export default function AddSubGoalModal({ goalId, currentCount, color, onAdd, onClose }: Props) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [dueTime, setDueTime]       = useState('')
  const [loading, setLoading]       = useState(false)

  async function handleAdd() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('sub_goals')
      .insert({
        goal_id:     goalId,
        title:       title.trim(),
        description: description.trim() || null,
        due_date:    dueDate || null,
        due_time:    dueTime || null,
        order_index: currentCount,
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
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Nueva submeta</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>
            #{String(currentCount + 1).padStart(2, '0')} en la línea de progreso
          </p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--dim)',
          cursor: 'pointer', padding: '4px', borderRadius: '6px',
          display: 'flex', transition: 'color var(--transition)',
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
            placeholder="Ej: Diseñar pantalla de login"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
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
            placeholder="Detalles de la submeta..."
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>FECHA LÍMITE</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div>
            <label style={labelStyle}>HORA LÍMITE</label>
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleAdd}
            disabled={!title.trim()}
            style={{ flex: 2, background: color, justifyContent: 'center' }}
          >
            Agregar submeta
          </Button>
        </div>
      </div>
    </div>
  )
}