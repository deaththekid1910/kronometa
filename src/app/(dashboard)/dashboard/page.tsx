'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useGoals } from '@/hooks/useGoals'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { localToday } from '@/lib/dailyTasks'
import { DailyTask } from '@/types/dailyTask'
import { getUserXP, getCurrentStreak, getLevelInfo, ACHIEVEMENTS } from '@/lib/gamification'
import { getWeeklyActivity, getTimeByGoal, DayActivity, GoalTimeData } from '@/lib/reports'
import GoalCard from '@/components/goals/GoalCard'
import CreateGoalModal from '@/components/goals/CreateGoalModal'
import GoalsSpotlight from '@/components/goals/GoalsSpotlight'
import Countdown from '@/components/goals/Countdown'
import WeeklyActivityChart from '@/components/reports/WeeklyActivityChart'
import TimeByGoalChart from '@/components/reports/TimeByGoalChart'
import WelcomeAnimation from '@/components/dashboard/WelcomeAnimation'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import TodayTasksSummary from '@/components/dashboard/TodayTasksSummary'
import RecentAchievements, { RecentAchievementItem } from '@/components/dashboard/RecentAchievements'
import RecentSessions, { RecentSessionItem } from '@/components/dashboard/RecentSessions'
import TopBar from '@/components/layout/TopBar'
import Badge from '@/components/ui/Badge'
import { Target, Repeat2, Clock, Flame, CheckCircle2, CalendarClock, Star, Plus } from 'lucide-react'

interface RawSession {
  id: string
  goal_id: string
  elapsed_seconds: number
  created_at: string
  started_at: string | null
  is_active: boolean
}

interface Extras {
  xp: number
  streak: number
  weeklyActivity: DayActivity[]
  timeByGoal: GoalTimeData[]
  todayPending: DailyTask[]
  completedToday: number
  pendingToday: number
  recentAchievements: RecentAchievementItem[]
  recentSessions: RecentSessionItem[]
}

export default function DashboardPage() {
  const { goals, loading } = useGoals()
  const [showModal,   setShowModal]   = useState(false)
  const [userId,      setUserId]      = useState('')
  const [userName,    setUserName]    = useState('')
  const [extras,      setExtras]      = useState<Extras | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  // Sesiones "crudas" del cronómetro, pendientes de cruzar con `goals` (ver efecto abajo).
  const [rawSessions, setRawSessions] = useState<RawSession[]>([])
  const router = useRouter()
  const bp     = useBreakpoint()

  useEffect(() => {
    setShowWelcome(typeof window !== 'undefined' && !sessionStorage.getItem('km_welcome_shown'))
    loadUserAndExtras()
  }, [])

  async function loadUserAndExtras() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario')

    const today = localToday()

    const [
      xp, streak, weeklyActivity, timeByGoal,
      { data: todayPending },
      { count: completedToday },
      { count: pendingToday },
      { data: achRows },
      { data: sessions },
    ] = await Promise.all([
      getUserXP(user.id),
      getCurrentStreak(user.id),
      getWeeklyActivity(user.id),
      getTimeByGoal(user.id),
      supabase.from('daily_tasks').select('*')
        .eq('user_id', user.id).eq('task_date', today).is('completed_at', null)
        .order('reminder_time', { ascending: true, nullsFirst: false }).limit(5),
      supabase.from('daily_tasks').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('task_date', today).not('completed_at', 'is', null),
      supabase.from('daily_tasks').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('task_date', today).is('completed_at', null),
      supabase.from('achievements').select('key, unlocked_at')
        .eq('user_id', user.id).order('unlocked_at', { ascending: false }).limit(4),
      supabase.from('timer_sessions').select('id, goal_id, elapsed_seconds, created_at, started_at, is_active')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    ])

    const recentAchievements: RecentAchievementItem[] = (achRows || [])
      .map(r => {
        const achievement = ACHIEVEMENTS.find(a => a.key === r.key)
        return achievement ? { achievement, unlockedAt: r.unlocked_at as string } : null
      })
      .filter((x): x is RecentAchievementItem => x !== null)

    setExtras({
      xp, streak, weeklyActivity, timeByGoal,
      todayPending: todayPending || [],
      completedToday: completedToday || 0,
      pendingToday: pendingToday || 0,
      recentAchievements,
      recentSessions: [],   // se completa abajo una vez `goals` está disponible
    })

    // Guardamos las sesiones "crudas" para cruzarlas con `goals` en el efecto de abajo.
    setRawSessions(sessions || [])
  }

  // Cruza las sesiones recientes con `goals` (ya cargado por useGoals) en cuanto ambos estén listos.
  useEffect(() => {
    if (!extras || rawSessions.length === 0 || goals.length === 0) return
    const goalMap = new Map(goals.map(g => [g.id, g]))
    const recentSessions: RecentSessionItem[] = rawSessions
      .map(s => {
        const g = goalMap.get(s.goal_id)
        if (!g) return null
        let secs = s.elapsed_seconds || 0
        if (s.is_active && s.started_at) secs += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
        const item: RecentSessionItem = { id: s.id, goalTitle: g.title, goalColor: g.color, goalType: g.type, seconds: secs, date: s.created_at }
        return item
      })
      .filter((x): x is RecentSessionItem => x !== null)

    setExtras(prev => prev ? { ...prev, recentSessions } : prev)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSessions, goals])

  function handleWelcomeComplete() {
    sessionStorage.setItem('km_welcome_shown', 'true')
    setShowWelcome(false)
  }

  function handleTaskToggled(id: string) {
    setExtras(prev => prev ? {
      ...prev,
      todayPending: prev.todayPending.filter(t => t.id !== id),
      completedToday: prev.completedToday + 1,
      pendingToday: Math.max(0, prev.pendingToday - 1),
    } : prev)
  }

  const metas   = goals.filter(g => g.type === 'goal')
  const habitos = goals.filter(g => g.type === 'habit')

  const totalCompleted = goals.reduce((a, g) => (g.sub_goals?.filter(s => s.completed_at).length || 0) + a, 0)
  const totalSubs      = goals.reduce((a, g) => (g.sub_goals?.length || 0) + a, 0)

  const nextDeadline = useMemo(() => {
    const now = Date.now()
    return metas
      .filter(g => g.deadline && new Date(g.deadline).getTime() > now)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0] || null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas.length])

  const timeToday   = extras?.weeklyActivity?.[extras.weeklyActivity.length - 1]?.seconds || 0
  const weeklyTotal = extras?.weeklyActivity?.reduce((a, d) => a + d.seconds, 0) || 0
  const weeklyAvg   = extras ? Math.round(weeklyTotal / 7) : 0
  const levelInfo   = getLevelInfo(extras?.xp || 0)

  const statsColumns = bp === 'mobile' ? 'repeat(2,1fr)' : bp === 'tablet' ? 'repeat(2,1fr)' : 'repeat(3,1fr)'
  const cardsColumns = bp === 'mobile' ? '1fr' : bp === 'tablet' ? 'repeat(2,1fr)' : 'repeat(3,1fr)'
  const sectionCols  = bp === 'mobile' ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))'
  const padding      = bp === 'mobile' ? '12px' : '20px'

  return (
    <>
      {showWelcome && userName && (
        <WelcomeAnimation userName={userName} onComplete={handleWelcomeComplete} />
      )}

      {bp === 'desktop' && <TopBar onNewGoal={() => setShowModal(true)} />}

      <div style={{ padding, display: 'flex', flexDirection: 'column', gap: bp === 'mobile' ? '14px' : '20px' }}>

        {userName && <DashboardHeader userName={userName} />}

        {/* HEADER móvil (botón nueva meta) */}
        {bp !== 'desktop' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowModal(true)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', background: 'var(--cyan)', color: '#0A0E1A',
              border: 'none', borderRadius: 'var(--radius-sm)',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={14} /> Nueva meta
            </button>
          </div>
        )}

        {!loading && <GoalsSpotlight goals={metas} />}

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: statsColumns, gap: '10px' }}>
          <StatCard icon={<Target size={14} />} label="Metas activas" value={metas.length} color="#00F5FF"
            subtitle={`${habitos.length} ${habitos.length === 1 ? 'hábito' : 'hábitos'}`} />
          <StatCard icon={<Clock size={14} />} label="Tiempo hoy" value={timeToday} format="time" color="#FFB800"
            subtitle={`Promedio: ${Math.floor(weeklyAvg / 60)} min/día`} />
          <StatCard icon={<Flame size={14} />} label="Racha activa" value={extras?.streak || 0} format="number" suffix="d" color="#FF3860"
            subtitle={(extras?.streak || 0) > 0 ? '¡Sigue así! 🔥' : 'Completa algo hoy para empezar'} />
          <StatCard icon={<CheckCircle2 size={14} />} label="Tareas hoy" value={extras?.completedToday || 0} color="#00FF88"
            subtitle={`${extras?.pendingToday || 0} pendientes`} />
          <StatCard icon={<Target size={14} />} label="Submetas" value={totalCompleted} color="#B026FF"
            subtitle={`de ${totalSubs} en total`} />

          {/* NIVEL / XP — tarjeta con barra de progreso, no encaja en StatCard genérica */}
          <div className="km-card-appear" style={{
            background: 'linear-gradient(135deg, #FFB80018 0%, #FFB80005 100%)',
            border: '1px solid #FFB80030', borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '11px', marginBottom: '10px' }}>
              <span style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#FFB80022', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB800' }}>
                <Star size={14} />
              </span>
              Nivel {levelInfo.level} · {levelInfo.title}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FFB800', lineHeight: 1, marginBottom: '8px' }}>
              {levelInfo.xpInLevel} / {levelInfo.xpForNext} XP
            </div>
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(100, levelInfo.progress)}%`,
                background: 'linear-gradient(90deg, #FFB80088, #FFB800)',
                borderRadius: '4px', transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        </div>

        {/* PRÓXIMO VENCIMIENTO */}
        {nextDeadline && (
          <div
            className="km-card-appear"
            onClick={() => router.push(`/goals/${nextDeadline.id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap',
              background: 'var(--surface)', border: `1px solid ${nextDeadline.color}30`,
              borderRadius: 'var(--radius-md)', padding: '12px 16px', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <CalendarClock size={14} color={nextDeadline.color} />
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Próximo vencimiento:</span>
              <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {nextDeadline.title}
              </span>
            </div>
            <Countdown targetDate={nextDeadline.deadline} startDate={nextDeadline.created_at} color={nextDeadline.color} variant="compact" />
          </div>
        )}

        {/* GRÁFICAS */}
        {extras && (weeklyTotal > 0 || extras.timeByGoal.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: sectionCols, gap: '14px' }}>
            <div className="km-card-appear" style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '18px',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500, marginBottom: '12px' }}>
                📊 ACTIVIDAD DE LA SEMANA
              </div>
              <WeeklyActivityChart data={extras.weeklyActivity} />
            </div>
            {extras.timeByGoal.length > 0 && (
              <div className="km-card-appear" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '18px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500, marginBottom: '12px' }}>
                  🎯 DISTRIBUCIÓN POR PROYECTO
                </div>
                <TimeByGoalChart data={extras.timeByGoal} />
              </div>
            )}
          </div>
        )}

        {/* TAREAS DE HOY + LOGROS RECIENTES */}
        {extras && (
          <div style={{ display: 'grid', gridTemplateColumns: sectionCols, gap: '14px' }}>
            <TodayTasksSummary tasks={extras.todayPending} onToggled={handleTaskToggled} />
            <RecentAchievements items={extras.recentAchievements} />
          </div>
        )}

        {/* SESIONES RECIENTES */}
        {extras && extras.recentSessions.length > 0 && (
          <RecentSessions sessions={extras.recentSessions} />
        )}

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
