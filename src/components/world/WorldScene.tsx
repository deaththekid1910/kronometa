'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { GoalWithStats, SubGoal } from '@/types'
import GoalWorld, { firstPendingIndex, currentXPercent } from './GoalWorld'
import DeadlineCard from '@/components/goals/DeadlineCard'
import TimerWidget from '@/components/timer/TimerWidget'
import { useTimerStore } from '@/store/timerStore'
import { getElapsedSeconds } from '@/lib/timer'
import { ChevronLeft, ChevronRight, Target, ExternalLink } from 'lucide-react'

// Ancho mínimo de la escena según el número de submetas: con muchas, la escena
// se desplaza en horizontal en vez de amontonar nodos y títulos (sobre todo en
// móvil).
const PX_PER_NODE = 120
const SCENE_EXTRA = 260

interface Props {
  goals: GoalWithStats[]
  totalSecondsByGoal: Record<string, number>
}

export default function WorldScene({ goals, totalSecondsByGoal }: Props) {
  const [activeIdx, setActiveIdx]     = useState(0)
  const [selectedSG, setSelectedSG]   = useState<SubGoal | null>(null)
  const sceneRef                      = useRef<HTMLDivElement>(null)

  // Tiempo en vivo: lo cerrado viene de la página y la sesión en curso (si el
  // cronómetro de esta meta está corriendo) se suma aquí cada segundo.
  const activeGoal = goals[Math.min(activeIdx, Math.max(goals.length - 1, 0))]
  const session    = useTimerStore(s => (activeGoal ? s.sessions[activeGoal.id] : undefined))
  useTimerStore(s => (session ? s.now : 0))

  // Centra la vista en la submeta actual al cambiar de meta
  useEffect(() => {
    const el = sceneRef.current
    if (!el || !activeGoal) return
    const pct = currentXPercent(activeGoal.sub_goals || [])
    el.scrollTo({ left: Math.max(0, (el.scrollWidth * pct) / 100 - el.clientWidth / 2), behavior: 'smooth' })
  }, [activeGoal?.id])

  // Esc cierra el detalle de la submeta
  useEffect(() => {
    if (!selectedSG) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedSG(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSG])

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

  const goal = activeGoal
  const subGoals   = goal.sub_goals || []
  const completed  = subGoals.filter(sg => sg.completed_at).length
  const total      = subGoals.length
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0
  const current    = firstPendingIndex(subGoals)
  const liveSecs   = (totalSecondsByGoal[goal.id] || 0) + (session ? getElapsedSeconds(session) : 0)

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
            <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {goal.title}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {completed}/{total} submetas · {progress}% completado
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '180px' }}>
            {goals.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActiveIdx(i)}
                title={g.title}
                aria-label={`Ver mundo de ${g.title}`}
                aria-current={i === activeIdx}
                style={{
                  // zona táctil de 20px con el punto de 8px en el centro
                  width: '20px', height: '20px', padding: 0,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{
                  width: i === activeIdx ? '10px' : '8px', height: i === activeIdx ? '10px' : '8px', borderRadius: '50%',
                  background: i === activeIdx ? g.color : 'var(--border)',
                  boxShadow: i === activeIdx ? `0 0 6px ${g.color}` : 'none',
                  transition: 'all var(--transition)',
                }} />
              </button>
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

      {/* ESCENA PRINCIPAL — se desplaza en horizontal si hay muchas submetas */}
      <div ref={sceneRef} style={{
        height: '460px', overflowX: 'auto', overflowY: 'hidden',
        borderRadius: 'var(--radius-lg)', scrollbarWidth: 'thin',
      }}>
        <div style={{ height: '100%', minWidth: `${total * PX_PER_NODE + SCENE_EXTRA}px` }}>
          <GoalWorld
            goal={goal}
            totalSeconds={liveSecs}
            onSubGoalClick={sg => setSelectedSG(sg)}
          />
        </div>
      </div>
      {total * PX_PER_NODE + SCENE_EXTRA > 700 && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '-4px' }}>
          ← Desliza la escena para ver todo el camino →
        </div>
      )}

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
              <div key={sg.id}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSG(sg) } }}
                style={{
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
                  minWidth: 0, lineHeight: 1.35, overflowWrap: 'anywhere',
                }}>
                  {sg.title}
                </span>
                {i === current && (
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
          role="dialog"
          aria-modal="true"
          aria-label={selectedSG.title}
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
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
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
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Link
                href={`/goals/${goal.id}`}
                style={{
                  flex: 1, padding: '10px', textAlign: 'center', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: goal.color, border: 'none',
                  borderRadius: 'var(--radius-sm)', color: '#0A0E1A',
                  fontSize: '13px', fontWeight: 600,
                }}
              >
                <ExternalLink size={13} /> Abrir meta
              </Link>
              <button
                onClick={() => setSelectedSG(null)}
                style={{
                  flex: 1, padding: '10px',
                  background: goal.color + '15', border: `1px solid ${goal.color}33`,
                  borderRadius: 'var(--radius-sm)', color: goal.color,
                  fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}