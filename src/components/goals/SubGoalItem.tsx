'use client'

import { useState } from 'react'
import { SubGoal } from '@/types'
import { createClient } from '@/lib/supabase'
import { awardXP, checkAndUnlockAchievements } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { Check, Calendar, ChevronRight, RotateCcw } from 'lucide-react'

interface Props {
  subGoal: SubGoal
  index: number
  color: string
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
}

export default function SubGoalItem({ subGoal, index, color, onComplete, onUncomplete }: Props) {
  const [loading, setLoading]             = useState(false)
  const [confirmUndo, setConfirmUndo]     = useState(false)
  const { addXP, setNewAchievements }     = useXPStore()
  const done = !!subGoal.completed_at

  async function handleComplete() {
    if (done || loading) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('sub_goals')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', subGoal.id)

    await supabase
      .from('avatar_state')
      .update({ current_subgoal_index: index + 1 })
      .eq('goal_id', subGoal.goal_id)
      .eq('user_id', user.id)

    await awardXP(user.id, subGoal.goal_id, 50)
    addXP(50)

    const newAchs = await checkAndUnlockAchievements(user.id)
    if (newAchs.length > 0) setNewAchievements(newAchs)

    onComplete(subGoal.id)
    setLoading(false)
  }

  async function handleUncomplete() {
    if (!done || loading) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('sub_goals')
      .update({ completed_at: null })
      .eq('id', subGoal.id)

    const { data: remaining } = await supabase
      .from('sub_goals')
      .select('id, completed_at, order_index')
      .eq('goal_id', subGoal.goal_id)
      .not('completed_at', 'is', null)
      .order('order_index', { ascending: false })

    const newIndex = remaining && remaining.length > 0 ? remaining[0].order_index + 1 : 0

    await supabase
      .from('avatar_state')
      .update({ current_subgoal_index: newIndex })
      .eq('goal_id', subGoal.goal_id)
      .eq('user_id', user.id)

    addXP(-50)
    onUncomplete(subGoal.id)
    setConfirmUndo(false)
    setLoading(false)
  }

  const isOverdue = !done && subGoal.due_date && new Date(subGoal.due_date) < new Date()

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '16px', borderRadius: 'var(--radius-md)',
      background: done ? `${color}08` : 'var(--surface)',
      border: `1px solid ${done ? color + '30' : 'var(--border)'}`,
      transition: 'all 0.3s ease', opacity: done ? 0.8 : 1,
    }}>

      {/* CHECKBOX */}
      <button
        onClick={done ? () => setConfirmUndo(true) : handleComplete}
        disabled={loading}
        style={{
          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${done ? color : 'var(--dim)'}`,
          background: done ? color : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: done ? `0 0 8px ${color}66` : 'none',
          marginTop: '1px',
        }}
      >
        {done && <Check size={13} color="#0A0E1A" strokeWidth={3} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontSize: '10px', fontFamily: 'var(--font-mono)',
            color: done ? color : 'var(--dim)',
            background: done ? `${color}15` : 'var(--border)',
            padding: '2px 6px', borderRadius: '4px',
          }}>#{String(index + 1).padStart(2, '0')}</span>
          <span style={{
            fontSize: '14px', fontWeight: 500,
            color: done ? 'var(--muted)' : 'var(--text)',
            textDecoration: done ? 'line-through' : 'none',
            transition: 'all 0.3s',
          }}>{subGoal.title}</span>
        </div>

        {subGoal.description && (
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
            {subGoal.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {subGoal.due_date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: isOverdue ? 'var(--red)' : 'var(--muted)' }}>
              <Calendar size={11} />
              {new Date(subGoal.due_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              {subGoal.due_time && ` · ${subGoal.due_time.slice(0, 5)}`}
              {isOverdue && ' · Vencida'}
            </span>
          )}
          {done && (
            <span style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono)' }}>+50 XP</span>
          )}
        </div>

        {/* CONFIRM DESMARCAR */}
        {confirmUndo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: '#FF386010', border: '1px solid #FF386030',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
              ¿Desmarcar esta submeta? (-50 XP)
            </span>
            <button onClick={handleUncomplete} disabled={loading} style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'var(--red)', border: 'none',
              color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
            }}>
              {loading ? '...' : 'Sí'}
            </button>
            <button onClick={() => setConfirmUndo(false)} style={{
              padding: '4px 10px', borderRadius: '6px',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
            }}>
              No
            </button>
          </div>
        )}
      </div>

      {!done
        ? <ChevronRight size={16} color="var(--dim)" style={{ flexShrink: 0, marginTop: '2px' }} />
        : !confirmUndo && (
          <button
            onClick={() => setConfirmUndo(true)}
            title="Desmarcar"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '4px 6px',
              color: 'var(--dim)', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'
            }}
          >
            <RotateCcw size={12} />
          </button>
        )
      }
    </div>
  )
}