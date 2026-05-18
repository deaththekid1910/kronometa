'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/hooks/useGoals'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { Target, Repeat2, Clock, Star, Flame, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { goals, loading } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const bp     = useBreakpoint()

  const metas   = goals.filter(g => g.type === 'goal')
  const habitos = goals.filter(g => g.type === 'habit')

  const totalCompleted = goals.reduce((a, g) => (g.sub_goals?.filter(s => s.completed_at).length || 0) + a, 0)
  const totalSubs      = goals.reduce((a, g) => (g.sub_goals?.length || 0) + a, 0)

  const statsColumns = bp === 'mobile' ? 'repeat(2,1fr)' : bp === 'tablet' ? 'repeat(2,1fr)' : 'repeat(4,1fr)'
  const cardsColumns = bp === 'mobile' ? '1fr' : bp === 'tablet' ? 'repeat(2,1fr)' : 'repeat(3,1fr)'
  const padding      = bp === 'mobile' ? '12px' : '20px'

  return (
    <>
      {bp === 'desktop' && <TopBar onNewGoal={() => setShowModal(true)} />}

      <div style={{ padding, display: 'flex', flexDirection: 'column', gap: bp === 'mobile' ? '14px' : '20px' }}>

        {/* HEADER móvil */}
        {bp !== 'desktop' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Dashboard</h1>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>{goals.length} elementos activos</p>
            </div>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--cyan)', color: '#0A0E1A',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} />
              {bp === 'mobile' ? 'Nueva' : 'Nueva meta'}
            </button>
          </div>
        )}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: statsColumns, gap: '10px' }}>
          {[
            { icon: <Clock size={13} />,  label: 'Tiempo hoy',    value: '04:32', sub: '+1h vs ayer', color: 'var(--cyan)',   glow: '#00F5FF' },
            { icon: <Star size={13} />,   label: 'XP ganados',    value: '+340',  sub: 'Esta semana', color: 'var(--purple)', glow: '#B026FF' },
            { icon: <Target size={13} />, label: 'Submetas',      value: `${totalCompleted}/${totalSubs}`, sub: 'completadas', color: 'var(--green)', glow: '#00FF88' },
            { icon: <Flame size={13} />,  label: 'Racha',         value: '14d',   sub: 'Récord: 21d', color: 'var(--amber)', glow: '#FFB800' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: bp === 'mobile' ? '12px 14px' : '16px 18px',
              transition: 'all var(--transition)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                {s.label}
              </div>
              <div style={{ fontSize: bp === 'mobile' ? '18px' : '22px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color, marginBottom: '2px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--dim)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>cargando...</div>
        ) : (
          <>
            {metas.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Target size={13} color="var(--muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>METAS Y PROYECTOS</span>
                  <Badge color="gray">{metas.length}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: cardsColumns, gap: '10px' }}>
                  {metas.map(g => <GoalCard key={g.id} goal={g} onClick={() => router.push(`/goals/${g.id}`)} />)}
                </div>
              </div>
            )}

            {habitos.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Repeat2 size={13} color="var(--muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>HÁBITOS DIARIOS</span>
                  <Badge color="gray">{habitos.length}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: cardsColumns, gap: '10px' }}>
                  {habitos.map(g => <GoalCard key={g.id} goal={g} onClick={() => router.push(`/goals/${g.id}`)} />)}
                </div>
              </div>
            )}

            {goals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#00F5FF0D', border: '1px solid #00F5FF20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={24} color="var(--cyan)" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>Sin metas aún</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Crea tu primera meta o hábito</div>
                </div>
                <button onClick={() => setShowModal(true)} style={{
                  padding: '9px 20px', background: 'var(--cyan)', color: '#0A0E1A',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>
                  Crear primera meta
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <CreateGoalModal onClose={() => setShowModal(false)} />
        </div>
      )}
    </>
  )
}