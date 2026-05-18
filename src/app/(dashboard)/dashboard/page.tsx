'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals } from '@/hooks/useGoals'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { Target, Repeat2, Clock, Star, Flame, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { goals, loading } = useGoals()
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  const metas   = goals.filter(g => g.type === 'goal')
  const habitos = goals.filter(g => g.type === 'habit')

  const totalCompleted = goals.reduce((a, g) => (g.sub_goals?.filter(s => s.completed_at).length || 0) + a, 0)
  const totalSubs      = goals.reduce((a, g) => (g.sub_goals?.length || 0) + a, 0)

  return (
    <>
      <TopBar onNewGoal={() => setShowModal(true)} />

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* STATS — 4 columnas horizontales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { icon: <Clock size={14} />,  label: 'Tiempo hoy',    value: '04:32', sub: '+1h vs ayer',  color: 'var(--cyan)',   glow: '#00F5FF' },
            { icon: <Star size={14} />,   label: 'XP ganados',    value: '+340',  sub: 'Esta semana',  color: 'var(--purple)', glow: '#B026FF' },
            { icon: <Target size={14} />, label: 'Submetas',      value: `${totalCompleted}/${totalSubs}`, sub: 'completadas', color: 'var(--green)',  glow: '#00FF88' },
            { icon: <Flame size={14} />,  label: 'Racha hábitos', value: '14d',   sub: 'Récord: 21d',  color: 'var(--amber)',  glow: '#FFB800' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 18px',
              transition: 'all var(--transition)', cursor: 'default',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.glow + '44' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '11px', marginBottom: '10px' }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                {s.label}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--dim)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            cargando...
          </div>
        ) : (
          <>
            {/* METAS — grid horizontal 3 columnas */}
            {metas.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Target size={13} color="var(--muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>METAS Y PROYECTOS</span>
                  <Badge color="gray">{metas.length} activas</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {metas.map(g => (
                    <GoalCard key={g.id} goal={g} onClick={() => router.push(`/goals/${g.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* HÁBITOS — grid horizontal 3 columnas */}
            {habitos.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Repeat2 size={13} color="var(--muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>HÁBITOS DIARIOS</span>
                  <Badge color="gray">{habitos.length} activos</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {habitos.map(g => (
                    <GoalCard key={g.id} goal={g} onClick={() => router.push(`/goals/${g.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {goals.length === 0 && (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#00F5FF0D', border: '1px solid #00F5FF20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={28} color="var(--cyan)" />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Sin metas aún</div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Crea tu primera meta o hábito para empezar</div>
                </div>
                <button onClick={() => setShowModal(true)} style={{
                  padding: '10px 22px', background: 'var(--cyan)', color: '#0A0E1A',
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