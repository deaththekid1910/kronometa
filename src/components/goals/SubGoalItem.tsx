'use client'

import { useState } from 'react'
import { SubGoal } from '@/types'
import { createClient } from '@/lib/supabase'
import { awardXP, checkAndUnlockAchievements } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { Check, Calendar, ChevronRight, RotateCcw, Pencil, Trash2 } from 'lucide-react'
import { playCompleteSound } from '@/lib/notificationSound'
import EditSubGoalModal from './EditSubGoalModal'

interface Props {
  subGoal: SubGoal
  index: number
  color: string
  onComplete:   (id: string) => void
  onUncomplete: (id: string) => void
  onUpdate:     (updated: SubGoal) => void
  onDelete:     (id: string) => void
}

export default function SubGoalItem({
  subGoal, index, color,
  onComplete, onUncomplete, onUpdate, onDelete
}: Props) {
  const [loading,      setLoading]      = useState(false)
  const [confirmUndo,  setConfirmUndo]  = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(false)
  const [showEdit,     setShowEdit]     = useState(false)
  const { addXP, setNewAchievements }   = useXPStore()
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

    playCompleteSound()
    onComplete(subGoal.id)

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
      .select('order_index')
      .eq('goal_id', subGoal.goal_id)
      .not('completed_at', 'is', null)
      .order('order_index', { ascending: false })

    const newIndex = remaining && remaining.length > 0
      ? remaining[0].order_index + 1
      : 0

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

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('sub_goals').delete().eq('id', subGoal.id)
    onDelete(subGoal.id)
    setLoading(false)
  }

  const isOverdue = !done && subGoal.due_date &&
    new Date(subGoal.due_date) < new Date()

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: done ? `${color}08` : 'var(--surface)',
        border: `1px solid ${done ? color + '30' : 'var(--border)'}`,
        transition: 'all 0.3s ease',
        opacity: done ? 0.8 : 1,
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

        {/* CONTENIDO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '10px', fontFamily: 'var(--font-mono)',
              color: done ? color : 'var(--dim)',
              background: done ? `${color}15` : 'var(--border)',
              padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
            }}>
              #{String(index + 1).padStart(2, '0')}
            </span>
            <span style={{
              fontSize: '14px', fontWeight: 500,
              color: done ? 'var(--muted)' : 'var(--text)',
              textDecoration: done ? 'line-through' : 'none',
              transition: 'all 0.3s',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {subGoal.title}
            </span>
          </div>

          {subGoal.description && (
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
              {subGoal.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {subGoal.due_date && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px',
                color: isOverdue ? 'var(--red)' : 'var(--muted)',
              }}>
                <Calendar size={11} />
                {new Date(subGoal.due_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                {subGoal.due_time && ` · ${subGoal.due_time.slice(0, 5)}`}
                {isOverdue && ' · Vencida'}
              </span>
            )}
            {done && (
              <span style={{ fontSize: '11px', color, fontFamily: 'var(--font-mono)' }}>
                +50 XP
              </span>
            )}
            {done && subGoal.completed_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color }}>
                <Check size={11} />
                {new Date(subGoal.completed_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          {/* CONFIRM DESMARCAR */}
          {confirmUndo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FF386010', border: '1px solid #FF386030',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                ¿Desmarcar? (-50 XP)
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

          {/* CONFIRM ELIMINAR */}
          {confirmDel && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FF386010', border: '1px solid #FF386030',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                ¿Eliminar esta submeta?
              </span>
              <button onClick={handleDelete} disabled={loading} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'var(--red)', border: 'none',
                color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
              }}>
                {loading ? '...' : 'Sí'}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
              }}>
                No
              </button>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {!done && !confirmUndo && !confirmDel && (
            <ChevronRight size={14} color="var(--dim)" />
          )}

          {/* EDITAR */}
          {!confirmUndo && !confirmDel && (
            <button
              onClick={() => setShowEdit(true)}
              title="Editar submeta"
              style={{
                width: '26px', height: '26px', borderRadius: '6px',
                background: 'transparent', border: '1px solid transparent',
                color: 'var(--dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${color}15`
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${color}33`
                ;(e.currentTarget as HTMLButtonElement).style.color = color
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'
              }}
            >
              <Pencil size={12} />
            </button>
          )}

          {/* DESMARCAR */}
          {done && !confirmUndo && !confirmDel && (
            <button
              onClick={() => setConfirmUndo(true)}
              title="Desmarcar"
              style={{
                width: '26px', height: '26px', borderRadius: '6px',
                background: 'transparent', border: '1px solid transparent',
                color: 'var(--dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FFB80015'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#FFB80033'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'
              }}
            >
              <RotateCcw size={12} />
            </button>
          )}

          {/* ELIMINAR */}
          {!confirmUndo && !confirmDel && (
            <button
              onClick={() => setConfirmDel(true)}
              title="Eliminar submeta"
              style={{
                width: '26px', height: '26px', borderRadius: '6px',
                background: 'transparent', border: '1px solid transparent',
                color: 'var(--dim)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#FF386015'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#FF386033'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditSubGoalModal
            subGoal={subGoal}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </div>
      )}
    </>
  )
}