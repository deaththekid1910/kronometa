'use client'

import { GoalWithStats, SubGoal } from '@/types'
import TimerWidget from '@/components/timer/TimerWidget'
import { ShoppingCart, Cpu, Clock, Target, Repeat2, Pencil, Trash2 } from 'lucide-react'

interface Props {
  goal: GoalWithStats
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}

const colorMap: Record<string, string> = {
  '#00F5FF': 'cyan',
  '#B026FF': 'purple',
  '#00FF88': 'green',
  '#FFB800': 'amber',
  '#FF3860': 'red',
}

export default function GoalCard({ goal, onClick, onEdit, onDelete }: Props) {
  const subGoals  = goal.sub_goals || []
  const completed = subGoals.filter(sg => sg.completed_at).length
  const total     = subGoals.length
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0
  const avatarPct = total > 0 ? (completed / total) * 100 : 0
  const accent    = goal.color

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px',
        cursor: 'pointer',
        transition: 'all var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = accent + '44'
        el.style.transform   = 'translateY(-2px)'
        el.style.boxShadow   = `0 8px 32px ${accent}18`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--border)'
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: accent + '12', border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {goal.type === 'habit'
              ? <Repeat2 size={17} color={accent} />
              : <Target size={17} color={accent} />
            }
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{goal.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {goal.type === 'habit' ? 'Hábito diario' : `${completed}/${total} submetas`}
            </div>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TimerWidget goalId={goal.id} color={accent} />
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar meta"
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
              title="Eliminar meta"
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

      {goal.type === 'goal' && total > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Progreso</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: accent }}>{progress}%</span>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent}88, ${accent})`,
              borderRadius: '4px', transition: 'width 0.6s ease',
            }} />
          </div>

          <div style={{ position: 'relative', height: '26px' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border)', borderRadius: '2px', transform: 'translateY(-50%)' }}>
              <div style={{ height: '100%', width: `${avatarPct}%`, background: accent + '44', transition: 'width 0.6s ease' }} />
            </div>
            {subGoals.map((sg, i) => {
              const pct = total > 1 ? (i / (total - 1)) * 100 : 50
              return (
                <div key={sg.id} style={{
                  position: 'absolute', top: '50%',
                  left: `${pct}%`, transform: 'translate(-50%,-50%)',
                  width: sg.completed_at ? '10px' : '8px',
                  height: sg.completed_at ? '10px' : '8px',
                  borderRadius: '50%',
                  background: sg.completed_at ? accent : 'var(--bg)',
                  border: `1.5px solid ${sg.completed_at ? accent : 'var(--dim)'}`,
                  boxShadow: sg.completed_at ? `0 0 6px ${accent}88` : 'none',
                  transition: 'all 0.3s', zIndex: 1,
                }} />
              )
            })}
            <div style={{
              position: 'absolute', top: '50%',
              left: `${avatarPct}%`,
              transform: 'translate(-50%,-50%)',
              width: '20px', height: '20px', borderRadius: '50%',
              background: accent,
              border: '2px solid var(--bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', color: '#0A0E1A', fontWeight: 700, zIndex: 2,
              boxShadow: `0 0 10px ${accent}88`,
              transition: 'left 0.6s ease',
            }}>★</div>
          </div>

          {goal.deadline && (
            <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'flex-end' }}>
              Vence {new Date(goal.deadline).toLocaleDateString('es-VE')}
            </div>
          )}
        </>
      )}
    </div>
  )
}