'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Goal, GoalWithStats } from '@/types'
import ColorPicker from '@/components/ui/ColorPicker'
import Button from '@/components/ui/Button'
import { Pencil, X, Bell } from 'lucide-react'

interface Props {
  goal: GoalWithStats
  onSave: (updated: Partial<Goal> & { id: string }) => void
  onClose: () => void
}

// Modal 100% editable para una meta o hábito: título, descripción,
// fecha límite (solo metas) y color, todo en un mismo lugar.
export default function EditGoalModal({ goal, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState(goal.title)
  const [description, setDescription] = useState(goal.description || '')
  const [deadline,    setDeadline]    = useState(goal.deadline || '')
  const [reminderOn,  setReminderOn]  = useState(!!goal.reminder_time)
  const [reminderTime,setReminderTime]= useState(goal.reminder_time || '09:00')
  const [color,       setColor]       = useState(goal.color)
  const [usedColors,  setUsedColors]  = useState<string[]>([])
  const [loading,     setLoading]     = useState(false)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('goals')
        .select('id, color')
        .eq('user_id', user.id)
        .eq('archived', false)
      setUsedColors((data || []).filter(g => g.id !== goal.id).map(g => g.color).filter(Boolean))
    })()
  }, [goal.id])

  async function handleSave() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()

    const base = {
      title:       title.trim(),
      description: description.trim() || null,
      deadline:    goal.type === 'goal' ? (deadline || null) : goal.deadline || null,
      color,
    }

    // Intenta incluir reminder_time; si la columna aún no existe en la BD
    // (falta correr supabase/habit_reminders.sql), reintenta sin ella para
    // no bloquear la edición de título/descripción/color.
    let { data } = await supabase
      .from('goals')
      .update({
        ...base,
        reminder_time: goal.type === 'habit' ? (reminderOn ? reminderTime : null) : goal.reminder_time || null,
      })
      .eq('id', goal.id)
      .select()
      .single()

    if (!data) {
      const retry = await supabase
        .from('goals')
        .update(base)
        .eq('id', goal.id)
        .select()
        .single()
      data = retry.data
    }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: `${color}15`, border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pencil size={15} color={color} />
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>
            Editar {goal.type === 'habit' ? 'hábito' : 'meta'}
          </h2>
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
            placeholder={goal.type === 'habit' ? 'Ej: Estudiar inglés' : 'Ej: My Comercio We'}
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
            placeholder="Detalles adicionales..."
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = color}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {goal.type === 'goal' && (
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              FECHA LÍMITE (opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => e.target.style.borderColor = color}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {goal.type === 'habit' && (
          <div style={{
            background: '#0d1120', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px',
            display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={14} color={reminderOn ? color : 'var(--dim)'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>Recordatorio diario</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Te avisa con sonido a esta hora cada día</div>
              </div>
              <button
                type="button"
                onClick={() => setReminderOn(v => !v)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: reminderOn ? color : 'var(--border)',
                  border: 'none', cursor: 'pointer', position: 'relative',
                  transition: 'background 0.2s', flexShrink: 0,
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
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark', color, fontWeight: 600 }}
                onFocus={e => e.target.style.borderColor = color}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            )}
          </div>
        )}

        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
            COLOR
          </label>
          <ColorPicker value={color} onChange={setColor} usedColors={usedColors} />
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
            style={{ flex: 2, background: color, color: '#0A0E1A', justifyContent: 'center' }}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
