'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { GoalWithStats } from '@/types'
import { localDateKey, daysAgoKey, currentStreak, lastDays } from '@/lib/dates'
import HabitCard from '@/components/habits/HabitCard'
import HabitLogModal from '@/components/habits/HabitLogModal'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import EditGoalModal from '@/components/goals/EditGoalModal'
import Button from '@/components/ui/Button'
import { Panel, StatRow, PageHeader, PageShell, ModalBackdrop } from '@/components/ui/Layout'
import { Repeat2, Plus, Circle, CheckCircle2 } from 'lucide-react'

const ACCENT = '#00FF88'

export default function HabitsPage() {
  const router = useRouter()
  const [habits, setHabits]         = useState<GoalWithStats[]>([])
  const [logs, setLogs]             = useState<Record<string, Set<string>>>({})
  const [userId, setUserId]         = useState<string>('')
  const [loading, setLoading]       = useState(true)
  const [logTarget, setLogTarget]   = useState<GoalWithStats | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget]     = useState<GoalWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GoalWithStats | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const bp        = useBreakpoint()
  const isMobile  = bp === 'mobile'
  const isDesktop = bp === 'desktop'
  const today     = localDateKey()

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
    if (!user) { setLoading(false); return }
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
      // Una sola consulta para los registros de todos los hábitos (antes era
      // una por hábito). Basta con el último año para calcular las rachas.
      const logsMap: Record<string, Set<string>> = {}
      for (const h of data) logsMap[h.id] = new Set()
      if (data.length > 0) {
        const { data: allLogs } = await supabase
          .from('habit_logs')
          .select('goal_id, logged_date')
          .in('goal_id', data.map(h => h.id))
          .gte('logged_date', daysAgoKey(366))
        for (const l of allLogs || []) logsMap[l.goal_id]?.add(l.logged_date)
      }
      setLogs(logsMap)
    }
    setLoading(false)
  }

  const datesOf          = (id: string) => logs[id] || new Set<string>()
  const getStreak        = (id: string) => currentStreak(datesOf(id))
  const isCompletedToday = (id: string) => datesOf(id).has(today)

  function handleMarkToday(e: React.MouseEvent, habit: GoalWithStats) {
    e.stopPropagation()
    if (isCompletedToday(habit.id)) return
    setLogTarget(habit)
  }

  function handleLogged() {
    if (!logTarget) return
    setLogs(prev => ({ ...prev, [logTarget.id]: new Set([...(prev[logTarget.id] || []), today]) }))
    setLogTarget(null)
  }

  const pending  = habits.filter(h => !isCompletedToday(h.id))
  const done     = habits.filter(h => isCompletedToday(h.id))
  const pct      = habits.length > 0 ? Math.round((done.length / habits.length) * 100) : 0
  const best     = habits.reduce<{ title: string; streak: number } | null>((acc, h) => {
    const s = getStreak(h.id)
    return !acc || s > acc.streak ? { title: h.title, streak: s } : acc
  }, null)

  const card = (h: GoalWithStats) => (
    <HabitCard
      key={h.id}
      habit={h}
      streak={getStreak(h.id)}
      completedToday={isCompletedToday(h.id)}
      week={lastDays(datesOf(h.id), 7)}
      onClick={() => router.push(`/habits/${h.id}`)}
      onMarkToday={e => handleMarkToday(e, h)}
      onEdit={() => setEditTarget(h)}
      onDelete={() => setDeleteTarget(h)}
    />
  )

  return (
    <PageShell isMobile={isMobile}>
      <PageHeader
        icon={<Repeat2 size={18} />} color={ACCENT} title="Hábitos diarios"
        subtitle="Construye consistencia día a día" isMobile={isMobile}
        action={
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}
            style={{ background: ACCENT, color: '#0A0E1A' }}>
            Nuevo hábito
          </Button>
        }
      />

      {habits.length > 0 && (
        <StatRow isMobile={isMobile} stats={[
          { label: 'Hechos hoy',  value: `${done.length}/${habits.length}`, color: ACCENT, bar: pct },
          { label: 'Pendientes',  value: pending.length,                     color: 'var(--amber)' },
          { label: 'Total hábitos', value: habits.length,                    color: 'var(--cyan)' },
          { label: 'Mejor racha', value: `${best?.streak || 0}d`, hint: best && best.streak > 0 ? best.title : undefined, color: 'var(--purple)' },
        ]} />
      )}

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
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}
            style={{ background: ACCENT, color: '#0A0E1A' }}>
            Crear hábito
          </Button>
        </div>
      ) : (
        <div style={{
          display: 'grid', alignItems: 'start', gap: isMobile ? '12px' : '16px',
          gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
        }}>
          <Panel icon={<Circle size={14} />} title="Pendientes hoy" color="var(--amber)" count={pending.length} isMobile={isMobile}>
            {pending.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem 1rem', margin: 0 }}>
                ¡Completaste todos tus hábitos de hoy! 🎉
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>{pending.map(card)}</div>
            )}
          </Panel>

          <Panel icon={<CheckCircle2 size={14} />} title="Hechos hoy" color={ACCENT} count={done.length} isMobile={isMobile}>
            {done.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem 1rem', margin: 0 }}>
                Los hábitos que marques hoy aparecerán aquí.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>{done.map(card)}</div>
            )}
          </Panel>
        </div>
      )}

      {logTarget && (
        <ModalBackdrop>
          <HabitLogModal
            goalId={logTarget.id}
            userId={userId}
            color={logTarget.color}
            onLogged={handleLogged}
            onClose={() => setLogTarget(null)}
          />
        </ModalBackdrop>
      )}

      {showCreate && (
        <ModalBackdrop>
          <CreateGoalModal onClose={() => { setShowCreate(false); loadHabits() }} />
        </ModalBackdrop>
      )}

      {editTarget && (
        <ModalBackdrop>
          <EditGoalModal
            goal={editTarget}
            onSave={updated => {
              setHabits(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h))
              setEditTarget(null)
            }}
            onClose={() => setEditTarget(null)}
          />
        </ModalBackdrop>
      )}

      {deleteTarget && (
        <ModalBackdrop>
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
        </ModalBackdrop>
      )}
    </PageShell>
  )
}
