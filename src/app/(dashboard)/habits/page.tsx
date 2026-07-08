'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { GoalWithStats } from '@/types'
import HabitCard from '@/components/habits/HabitCard'
import HabitLogModal from '@/components/habits/HabitLogModal'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import EditGoalModal from '@/components/goals/EditGoalModal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Repeat2, Plus } from 'lucide-react'

export default function HabitsPage() {
  const router = useRouter()
  const [habits, setHabits]         = useState<GoalWithStats[]>([])
  const [logs, setLogs]             = useState<Record<string, { logged_date: string }[]>>({})
  const [userId, setUserId]         = useState<string>('')
  const [loading, setLoading]       = useState(true)
  const [logTarget, setLogTarget]   = useState<GoalWithStats | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget]     = useState<GoalWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GoalWithStats | null>(null)
  const [deleting, setDeleting]         = useState(false)

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('goals').update({ archived: true }).eq('id', deleteTarget.id)
    setHabits(prev => prev.filter(h => h.id !== deleteTarget.id))
    setDeleting(false)
    setDeleteTarget(null)
  }

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'habit')
      .eq('archived', false)
      .order('created_at', { ascending: false })

    if (data) {
      setHabits(data)
      const logsMap: Record<string, { logged_date: string }[]> = {}
      for (const h of data) {
        const { data: hLogs } = await supabase
          .from('habit_logs')
          .select('logged_date')
          .eq('goal_id', h.id)
          .order('logged_date', { ascending: false })
          .limit(60)
        logsMap[h.id] = hLogs || []
      }
      setLogs(logsMap)
    }
    setLoading(false)
  }

  function getStreak(goalId: string): number {
    const habitLogs = logs[goalId] || []
    const logDates  = new Set(habitLogs.map(l => l.logged_date))
    let streak = 0
    for (let i = 0; i <= 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (logDates.has(key)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  function isCompletedToday(goalId: string): boolean {
    const today = new Date().toISOString().split('T')[0]
    return (logs[goalId] || []).some(l => l.logged_date === today)
  }

  async function handleMarkToday(e: React.MouseEvent, habit: GoalWithStats) {
    e.stopPropagation()
    if (isCompletedToday(habit.id)) return
    setLogTarget(habit)
  }

  function handleLogged() {
    if (!logTarget) return
    const today = new Date().toISOString().split('T')[0]
    setLogs(prev => ({
      ...prev,
      [logTarget.id]: [{ logged_date: today }, ...(prev[logTarget.id] || [])]
    }))
    setLogTarget(null)
  }

  const completedToday = habits.filter(h => isCompletedToday(h.id)).length

  return (
    <div style={{ padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>Hábitos diarios</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
            Construye consistencia día a día
          </p>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          Nuevo hábito
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total hábitos',    value: habits.length,     color: 'var(--cyan)' },
          { label: 'Completados hoy',  value: completedToday,    color: 'var(--green)' },
          { label: 'Pendientes hoy',   value: habits.length - completedToday, color: 'var(--amber)' },
          { label: 'Mejor racha',      value: `${Math.max(0, ...habits.map(h => getStreak(h.id)))}d`, color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : habits.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#00FF8808', border: '1px solid #00FF8820', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Repeat2 size={28} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px' }}>Sin hábitos aún</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Crea tu primer hábito diario</div>
          </div>
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Crear hábito
          </Button>
        </div>
      ) : (
        <>
          {completedToday < habits.length && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Repeat2 size={13} color="var(--muted)" />
                <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>PENDIENTES HOY</span>
                <Badge color="amber">{habits.length - completedToday}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {habits.filter(h => !isCompletedToday(h.id)).map(h => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    streak={getStreak(h.id)}
                    completedToday={false}
                    onClick={() => router.push(`/habits/${h.id}`)}
                    onMarkToday={e => handleMarkToday(e, h)}
                    onEdit={() => setEditTarget(h)}
                    onDelete={() => setDeleteTarget(h)}
                  />
                ))}
              </div>
            </div>
          )}

          {completedToday > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>COMPLETADOS HOY</span>
                <Badge color="green">{completedToday}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {habits.filter(h => isCompletedToday(h.id)).map(h => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    streak={getStreak(h.id)}
                    completedToday={true}
                    onClick={() => router.push(`/habits/${h.id}`)}
                    onMarkToday={e => handleMarkToday(e, h)}
                    onEdit={() => setEditTarget(h)}
                    onDelete={() => setDeleteTarget(h)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {logTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <HabitLogModal
            goalId={logTarget.id}
            userId={userId}
            color={logTarget.color}
            onLogged={handleLogged}
            onClose={() => setLogTarget(null)}
          />
        </div>
      )}

      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <CreateGoalModal onClose={() => { setShowCreate(false); loadHabits() }} />
        </div>
      )}

      {editTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditGoalModal
            goal={editTarget}
            onSave={updated => {
              setHabits(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h))
              setEditTarget(null)
            }}
            onClose={() => setEditTarget(null)}
          />
        </div>
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid #FF386044',
            borderRadius: 'var(--radius-xl)', padding: '24px',
            width: '100%', maxWidth: '380px',
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 10px' }}>Eliminar hábito</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              ¿Eliminar <strong>{deleteTarget.title}</strong> y todo su historial? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="md" onClick={() => setDeleteTarget(null)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant="danger" size="md" loading={deleting} onClick={handleConfirmDelete}
                style={{ flex: 2, justifyContent: 'center', background: 'var(--red)', color: '#fff', border: 'none' }}
              >
                Sí, eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}