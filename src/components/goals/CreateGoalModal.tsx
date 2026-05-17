'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useGoalsStore } from '@/store/goalsStore'
import { GoalType } from '@/types'

const COLORS = ['#7F77DD', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa', '#fb7185']

interface Props {
  onClose: () => void
}

export default function CreateGoalModal({ onClose }: Props) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<GoalType>('goal')
  const [color, setColor] = useState('#7F77DD')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const { addGoal } = useGoalsStore()

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const { data } = await supabase.from('goals').insert({
      title: title.trim(),
      type,
      color,
      timezone,
      deadline: deadline || null,
      user_id: user.id,
      icon: type === 'habit' ? 'repeat' : 'target',
      archived: false
    }).select().single()

    if (data) {
      addGoal(data)
      if (type === 'goal') {
        await supabase.from('avatar_state').insert({
          user_id: user.id,
          goal_id: data.id,
          current_subgoal_index: 0,
          xp_total: 0,
          level: 1,
          skin_id: 'default'
        })
      }
    }
    setLoading(false)
    onClose()
  }

  return (
    <div style={{
      minHeight: '400px', background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#0f0f1a', border: '1px solid #7F77DD44',
        borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#e2e8f0', fontSize: '16px', fontWeight: 500 }}>Nueva {type === 'habit' ? 'hábito' : 'meta'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          {(['goal', 'habit'] as GoalType[]).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
              borderColor: type === t ? '#7F77DD' : '#1f2937',
              background: type === t ? '#7F77DD22' : 'transparent',
              color: type === t ? '#a78bfa' : '#6b7280',
              fontSize: '13px', cursor: 'pointer'
            }}>
              {t === 'goal' ? '◎ Meta / Proyecto' : '↺ Hábito'}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Nombre</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'habit' ? 'Ej: Estudiar inglés' : 'Ej: My Comercio We'}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            style={{
              width: '100%', padding: '10px 14px', background: '#1a1a2e',
              border: '1px solid #7F77DD33', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: c, cursor: 'pointer',
                border: color === c ? '2px solid #fff' : '2px solid transparent',
                transition: 'transform 0.15s',
                transform: color === c ? 'scale(1.2)' : 'scale(1)'
              }} />
            ))}
          </div>
        </div>

        {type === 'goal' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Fecha límite (opcional)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', background: '#1a1a2e',
                border: '1px solid #7F77DD33', borderRadius: '8px',
                color: '#e2e8f0', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', colorScheme: 'dark'
              }}
            />
          </div>
        )}

        <button onClick={handleCreate} disabled={loading || !title.trim()} style={{
          width: '100%', padding: '11px', background: color,
          border: 'none', borderRadius: '8px', color: '#fff',
          fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: !title.trim() ? 0.5 : 1, marginTop: '0.5rem'
        }}>
          {loading ? 'Creando...' : `Crear ${type === 'habit' ? 'hábito' : 'meta'}`}
        </button>
      </div>
    </div>
  )
}