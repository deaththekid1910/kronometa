'use client'

import { useState } from 'react'
import { SubGoal } from '@/types'
import { createClient } from '@/lib/supabase'
import { awardXP, checkAndUnlockAchievements } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { Check, Calendar, RotateCcw, Pencil, Trash2, GripVertical } from 'lucide-react'
import { ItemFooter, InlineConfirm, chip, actionBtn, ModalBackdrop } from '@/components/ui/Layout'
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
  isDragging?:  boolean
  isDragOver?:  boolean
  onDragStart?: () => void
  onDragOver?:  () => void
  onDrop?:      () => void
  onDragEnd?:   () => void
}

export default function SubGoalItem({
  subGoal, index, color,
  onComplete, onUncomplete, onUpdate, onDelete,
  isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd,
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
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={e => { e.preventDefault(); onDragOver?.() }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        style={{
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
          background: done ? `${color}08` : 'var(--surface2)',
          border: `1px solid ${isDragOver ? color : done ? color + '30' : isOverdue ? '#FF386033' : 'var(--border)'}`,
          transition: 'all 0.2s ease',
          opacity: isDragging ? 0.35 : (done ? 0.85 : 1),
          boxShadow: isDragOver ? `0 0 0 1px ${color}55, 0 6px 20px ${color}18` : 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}>

        {/* CUERPO: arrastre + casilla + número y título */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '14px 16px 12px 10px' }}>
          <div title="Arrastra para reordenar" style={{
            display: 'flex', alignItems: 'center', flexShrink: 0,
            color: 'var(--muted)', marginTop: '4px', opacity: 0.5,
          }}>
            <GripVertical size={14} />
          </div>

          <button
            onClick={done ? () => setConfirmUndo(true) : handleComplete}
            disabled={loading}
            title={done ? 'Desmarcar' : 'Completar submeta (+50 XP)'}
            aria-label={done ? 'Desmarcar submeta' : 'Completar submeta'}
            style={{
              width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${done ? color : 'var(--muted)'}`,
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)',
                color: done ? color : 'var(--muted)',
                background: done ? `${color}15` : '#ffffff0a',
                padding: '2px 6px', borderRadius: '4px', flexShrink: 0,
              }}>
                #{String(index + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: '14px', fontWeight: 500,
                color: done ? 'var(--muted)' : 'var(--text)',
                textDecoration: done ? 'line-through' : 'none',
                transition: 'all 0.3s',
                lineHeight: 1.4, overflowWrap: 'anywhere',
              }}>
                {subGoal.title}
              </span>
            </div>
            {subGoal.description && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {subGoal.description}
              </p>
            )}
          </div>
        </div>

        {/* PIE: fecha y XP · acciones */}
        <ItemFooter
          indent={44}
          meta={<>
            {subGoal.due_date && (
              <span style={chip(isOverdue ? '#FF3860' : '#94A3B8')}>
                <Calendar size={11} />
                {new Date(subGoal.due_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                {subGoal.due_time && ` · ${subGoal.due_time.slice(0, 5)}`}
                {isOverdue && ' · Vencida'}
              </span>
            )}
            {done && subGoal.completed_at && (
              <span style={chip(color)}>
                <Check size={11} />
                {new Date(subGoal.completed_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {done && <span style={{ ...chip(color), fontFamily: 'var(--font-mono)' }}>+50 XP</span>}
            {!subGoal.due_date && !done && <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Sin fecha</span>}
          </>}
          actions={confirmUndo ? (
            <InlineConfirm text="¿Desmarcar? (−50 XP)" loading={loading}
              onConfirm={handleUncomplete} onCancel={() => setConfirmUndo(false)} />
          ) : confirmDel ? (
            <InlineConfirm text="¿Eliminar?" confirmLabel="Sí, eliminar" loading={loading}
              onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />
          ) : (<>
            {done && (
              <button onClick={() => setConfirmUndo(true)} title="Desmarcar" aria-label="Desmarcar submeta" style={actionBtn('#FFB800')}>
                <RotateCcw size={13} />
              </button>
            )}
            <button onClick={() => setShowEdit(true)} title="Editar submeta" aria-label="Editar submeta" style={actionBtn(color)}>
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDel(true)} title="Eliminar submeta" aria-label="Eliminar submeta" style={actionBtn('#FF3860')}>
              <Trash2 size={13} />
            </button>
          </>)}
        />
      </div>

      {/* MODAL EDITAR */}
      {showEdit && (
        <ModalBackdrop>
          <EditSubGoalModal
            subGoal={subGoal}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </ModalBackdrop>
      )}
    </>
  )
}
