'use client'

import { GoalWithStats } from '@/types'
import TimerWidget from '@/components/timer/TimerWidget'
import { Repeat2, Flame, Pencil, Trash2 } from 'lucide-react'

interface Props {
  habit: GoalWithStats
  streak: number
  completedToday: boolean
  onClick: () => void
  onMarkToday: (e: React.MouseEvent) => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function HabitCard({ habit, streak, completedToday, onClick, onMarkToday, onEdit, onDelete }: Props) {
  const accent = habit.color

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)', border: `1px solid ${completedToday ? accent + '44' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)', padding: '18px',
        cursor: 'pointer', transition: 'all var(--transition)',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = accent + '55'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 8px 32px ${accent}18`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = completedToday ? accent + '44' : 'var(--border)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: completedToday
          ? `linear-gradient(90deg, transparent, ${accent}, transparent)`
          : 'transparent',
        transition: 'all 0.3s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: accent + '15', border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Repeat2 size={17} color={accent} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{habit.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Flame size={11} color="var(--amber)" />
              <span style={{ fontSize: '11px', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                {streak}d de racha
              </span>
            </div>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TimerWidget goalId={habit.id} color={accent} />
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar hábito"
              style={{
                width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                background: `${accent}12`, border: `1px solid ${accent}30`,
                color: accent, cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Eliminar hábito"
              style={{
                width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                background: '#FF386010', border: '1px solid #FF386030',
                color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={onMarkToday}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '20px',
            border: `1px solid ${completedToday ? accent + '44' : 'var(--border)'}`,
            background: completedToday ? accent + '15' : 'transparent',
            color: completedToday ? accent : 'var(--muted)',
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <span style={{ fontSize: '14px' }}>{completedToday ? '✓' : '○'}</span>
          {completedToday ? 'Completado hoy' : 'Marcar hoy'}
        </button>

        <span style={{ fontSize: '11px', color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}>
          {habit.timezone?.split('/')[1]?.replace('_', ' ') || 'VET'}
        </span>
      </div>
    </div>
  )
}