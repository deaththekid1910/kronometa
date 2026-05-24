'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { GoalWithStats, SubGoal } from '@/types'
import SubGoalItem from '@/components/goals/SubGoalItem'
import AvatarTrack from '@/components/goals/AvatarTrack'
import AddSubGoalModal from '@/components/goals/AddSubGoalModal'
import TimerWidget from '@/components/timer/TimerWidget'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { getTotalSeconds, formatTime } from '@/lib/timer'
import { ArrowLeft, Plus, Target, Calendar, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react'

export default function GoalDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [goal,      setGoal]      = useState<GoalWithStats | null>(null)
  const [subGoals,  setSubGoals]  = useState<SubGoal[]>([])
  const [totalSecs, setTotalSecs] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [confirmDel,setConfirmDel]= useState(false)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => { loadGoal() }, [id])

  async function loadGoal() {
    const supabase = createClient()
    const { data } = await supabase
      .from('goals')
      .select('*, sub_goals(*), avatar_state(*)')
      .eq('id', id)
      .single()

    if (data) {
      const sorted = (data.sub_goals || []).sort(
        (a: SubGoal, b: SubGoal) => a.order_index - b.order_index
      )
      setGoal({ ...data, avatar_state: data.avatar_state?.[0] })
      setSubGoals(sorted)
      const secs = await getTotalSeconds(id)
      setTotalSecs(secs)
    }
    setLoading(false)
  }

  function handleComplete(subGoalId: string) {
    setSubGoals(prev =>
      prev.map(sg => sg.id === subGoalId ? { ...sg, completed_at: new Date().toISOString() } : sg)
    )
  }

  function handleUncomplete(subGoalId: string) {
    setSubGoals(prev =>
      prev.map(sg => sg.id === subGoalId ? { ...sg, completed_at: undefined } : sg)
    )
  }

  function handleAddSubGoal(subGoal: SubGoal) {
    setSubGoals(prev => [...prev, subGoal])
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('goals').update({ archived: true }).eq('id', id)
    router.push('/goals')
    router.refresh()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      cargando...
    </div>
  )

  if (!goal) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <p style={{ color: 'var(--muted)' }}>Meta no encontrada</p>
      <Button variant="ghost" size="sm" onClick={() => router.back()}>Volver</Button>
    </div>
  )

  const completed = subGoals.filter(sg => sg.completed_at).length
  const total     = subGoals.length
  const progress  = total > 0 ? Math.round((completed / total) * 100) : 0
  const accent    = goal.color

  const badgeColor = (() => {
    if (accent === '#00F5FF') return 'cyan'
    if (accent === '#B026FF') return 'purple'
    if (accent === '#00FF88') return 'green'
    if (accent === '#FFB800') return 'amber'
    return 'gray'
  })() as 'cyan' | 'purple' | 'green' | 'amber' | 'gray'

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--muted)', cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{goal.title}</h1>
            <Badge color={badgeColor}>{goal.type === 'habit' ? 'Hábito' : 'Meta'}</Badge>
            {goal.deadline && new Date(goal.deadline) < new Date() && (
              <Badge color="red">Vencida</Badge>
            )}
          </div>
          {goal.description && (
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0' }}>{goal.description}</p>
          )}
        </div>
        <TimerWidget goalId={goal.id} color={accent} />

        {/* BOTÓN ELIMINAR */}
        <button
          onClick={() => setConfirmDel(true)}
          title="Eliminar meta"
          style={{
            width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
            background: '#FF386010', border: '1px solid #FF386030',
            color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#FF386025'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FF386010'}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* CONFIRM ELIMINAR */}
      {confirmDel && (
        <div style={{
          background: '#FF386010', border: '1px solid #FF386033',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
          marginBottom: '20px', display: 'flex', alignItems: 'center',
          gap: '12px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>
            ¿Eliminar <strong>{goal.title}</strong> y todas sus submetas?
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setConfirmDel(false)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--red)', border: 'none',
              color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
            }}>
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { icon: <CheckCircle2 size={14} />, label: 'Completadas', value: `${completed}/${total}`, color: 'var(--green)' },
          { icon: <Clock size={14} />,        label: 'Tiempo total', value: formatTime(totalSecs),  color: 'var(--amber)', mono: true },
          { icon: <Target size={14} />,       label: 'Progreso',    value: `${progress}%`,          color: accent },
          ...(goal.deadline ? [{
            icon: <Calendar size={14} />,
            label: 'Vence',
            value: new Date(goal.deadline).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' }),
            color: 'var(--muted)',
          }] : []),
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              {s.label}
            </div>
            <div style={{
              fontSize: '18px', fontWeight: 600, color: s.color,
              fontFamily: (s as any).mono ? 'var(--font-mono)' : 'var(--font-sans)',
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* AVATAR TRACK */}
      {goal.type === 'goal' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>PROGRESO GENERAL</span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: accent }}>{progress}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: `linear-gradient(90deg, ${accent}88, ${accent})`,
              borderRadius: '6px', transition: 'width 0.8s ease',
            }} />
          </div>
          <AvatarTrack subGoals={subGoals} color={accent} />
        </div>
      )}

      {/* SUBMETAS */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>SUBMETAS</span>
            <Badge color="gray">{total} en total</Badge>
          </div>
          {goal.type === 'goal' && (
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>
              Agregar
            </Button>
          )}
        </div>

        {subGoals.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem',
            background: 'var(--surface)', border: `1px dashed ${accent}33`,
            borderRadius: 'var(--radius-lg)',
          }}>
            <Circle size={32} color={accent} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '12px' }}>Sin submetas aún</p>
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowModal(true)}
              style={{ background: `${accent}12`, color: accent, borderColor: `${accent}30` }}>
              Agregar primera submeta
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subGoals.map((sg, i) => (
              <SubGoalItem
                key={sg.id}
                subGoal={sg}
                index={i}
                color={accent}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <AddSubGoalModal
            goalId={goal.id}
            currentCount={subGoals.length}
            color={accent}
            onAdd={handleAddSubGoal}
            onClose={() => setShowModal(false)}
          />
        </div>
      )}
    </div>
  )
}