'use client'

import { useState } from 'react'
import { SubGoal } from '@/types'
import { createClient } from '@/lib/supabase'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  subGoal: SubGoal
  color: string
  onSave: (updated: SubGoal) => void
  onClose: () => void
}

export default function EditSubGoalModal({ subGoal, color, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState(subGoal.title)
  const [description, setDescription] = useState(subGoal.description || '')
  const [dueDate,     setDueDate]     = useState(subGoal.due_date || '')
  const [dueTime,     setDueTime]     = useState(subGoal.due_time || '')
  const [loading,     setLoading]     = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('sub_goals')
      .update({
        title:       title.trim(),
        description: description.trim() || null,
        due_date:    dueDate || null,
        due_time:    dueTime || null,
      })
      .eq('id', subGoal.id)
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

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-xl)', padding: '24px',
      width: '100%', maxWidth: '440px',
      boxShadow: `0 0 40px ${color}18`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Editar submeta</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>
            #{String(subGoal.order_index + 1).padStart(2, '0')}
          </p>
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
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            TÍTULO *
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la submeta"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            DESCRIPCIÓN (opcional)
          </label>
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
            <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              FECHA LÍMITE
            </label>
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
            <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              HORA LÍMITE
            </label>
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
            onClick={handleSave}
            disabled={!title.trim()}
            style={{ flex: 2, background: color, justifyContent: 'center' }}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}