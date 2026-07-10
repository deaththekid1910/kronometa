'use client'

import { useState } from 'react'
import { GoalWithStats, SubGoal } from '@/types'
import GoalWorld from './GoalWorld'
import DeadlineCard from '@/components/goals/DeadlineCard'
import TimerWidget from '@/components/timer/TimerWidget'
import { ChevronLeft, ChevronRight, Target } from 'lucide-react'

interface Props {
  goals: GoalWithStats[]
  totalSecondsByGoal: Record<string, number>
}

export default function WorldScene({ goals, totalSecondsByGoal }: Props) {
  const [activeIdx, setActiveIdx]     = useState(0)
  const [selectedSG, setSelectedSG]   = useState<SubGoal | null>(null)

  if (goals.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '420px', gap: '16px',
      background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
    }}>
      <Target size={40} color="var(--dim)" />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Sin metas activas</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Crea una meta con submetas para ver tu mundo</div>
      </div>
    </div>
  )

  const goal = goals[activeIdx]
  const subGoals   = goal.sub_goals || []
  const completed  = subGoals.filter(sg => sg.completed_at).length
  const total      = subGoals.length
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* SELECTOR DE META */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '10px 16px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
          disabled={activeIdx === 0}
          style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: activeIdx === 0 ? 'var(--dim)' : 'var(--text)',
            cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: goal.color, flexShrink: 0,
            boxShadow: `0 0 8px ${goal.color}`,
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {goal.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {completed}/{total} submetas · {progress}% completado
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {goals.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveIdx(i)}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i === activeIdx ? g.color : 'var(--border)',
                  border: 'none', cursor: 'pointer',
                  boxShadow: i === activeIdx ? `0 0 6px ${g.color}` : 'none',
                  transition: 'all var(--transition)',
                }}
              />
            ))}
          </div>

          <div onClick={e => e.stopPropagation()}>
            <TimerWidget goalId={goal.id} color={goal.color} />
          </div>
        </div>

        <button
          onClick={() => setActiveIdx(i => Math.min(goals.length - 1, i + 1))}
          disabled={activeIdx === goals.length - 1}
          style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: 'transparent', border: '1px solid var(--border)',
            color: activeIdx === goals.length - 1 ? 'var(--dim)' : 'var(--text)',
            cursor: activeIdx === goals.length - 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* FECHA DE VENCIMIENTO */}
      {goal.deadline && (
        <DeadlineCard
          deadline={goal.deadline}
          timezone={goal.timezone}
          createdAt={goal.created_at}
          color={goal.color}
        />
      )}

      {/* ESCENA PRINCIPAL */}
      <div style={{ height: '460px' }}>
        <GoalWorld
          goal={goal}
          totalSeconds={totalSecondsByGoal[goal.id] || 0}
          onSubGoalClick={sg => setSelectedSG(sg)}
        />
      </div>

      {/* LISTA DE SUBMETAS */}
      {subGoals.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '12px', fontWeight: 500 }}>
            SUBMETAS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {subGoals.map((sg, i) => (
              <div key={sg.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                background: sg.completed_at ? `${goal.color}08` : 'var(--surface2)',
                border: `1px solid ${sg.completed_at ? goal.color + '22' : 'var(--border)'}`,
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
                onClick={() => setSelectedSG(sg)}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: sg.completed_at ? goal.color : 'transparent',
                  border: `2px solid ${sg.completed_at ? goal.color : 'var(--dim)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700,
                  color: sg.completed_at ? '#0A0E1A' : 'var(--dim)',
                  boxShadow: sg.completed_at ? `0 0 8px ${goal.color}66` : 'none',
                }}>
                  {sg.completed_at ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '13px', flex: 1,
                  color: sg.completed_at ? 'var(--muted)' : 'var(--text)',
                  textDecoration: sg.completed_at ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {sg.title}
                </span>
                {i === completed && !sg.completed_at && (
                  <span style={{
                    fontSize: '10px', color: goal.color,
                    background: goal.color + '15', border: `1px solid ${goal.color}33`,
                    padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
                  }}>Actual</span>
                )}
                {sg.due_date && !sg.completed_at && (
                  <span style={{ fontSize: '10px', color: 'var(--muted)', flexShrink: 0 }}>
                    {new Date(sg.due_date + 'T12:00:00').toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE SUBMETA */}
      {selectedSG && (
        <div
          onClick={() => setSelectedSG(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: `1px solid ${goal.color}44`,
              borderRadius: 'var(--radius-xl)', padding: '24px',
              maxWidth: '380px', width: '100%',
              boxShadow: `0 0 40px ${goal.color}22`,
            }}
          >
            <div style={{ fontSize: '10px', color: goal.color, letterSpacing: '1px', marginBottom: '8px' }}>
              SUBMETA #{(subGoals.findIndex(s => s.id === selectedSG.id) + 1).toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              {selectedSG.title}
            </div>
            {selectedSG.description && (
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.6 }}>
                {selectedSG.description}
              </div>
            )}
            {selectedSG.due_date && (
              <div style={{ fontSize: '12px', color: 'var(--amber)', marginBottom: '12px' }}>
                ⏰ Vence: {new Date(selectedSG.due_date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                {selectedSG.due_time && ` a las ${selectedSG.due_time.slice(0, 5)}`}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: selectedSG.completed_at ? goal.color : 'var(--dim)',
                boxShadow: selectedSG.completed_at ? `0 0 8px ${goal.color}` : 'none',
              }} />
              <span style={{ fontSize: '12px', color: selectedSG.completed_at ? goal.color : 'var(--muted)' }}>
                {selectedSG.completed_at
                  ? `Completada el ${new Date(selectedSG.completed_at).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}`
                  : 'Pendiente'
                }
              </span>
            </div>
            <button
              onClick={() => setSelectedSG(null)}
              style={{
                marginTop: '16px', width: '100%', padding: '10px',
                background: goal.color + '15', border: `1px solid ${goal.color}33`,
                borderRadius: 'var(--radius-sm)', color: goal.color,
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}