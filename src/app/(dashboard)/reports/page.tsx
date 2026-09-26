'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  getReportsData, ReportsData,
  timeByArea, weeklyByArea, habitConsistencyOf, goalProgressOf,
  dailyTaskStatsOf, scheduleStatsOf,
} from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import TimeByGoalChart       from '@/components/reports/TimeByGoalChart'
import WeeklyActivityChart   from '@/components/reports/WeeklyActivityChart'
import HabitConsistencyChart from '@/components/reports/HabitConsistencyChart'
import CandlestickChart      from '@/components/reports/CandlestickChart'
import DateHistorySection    from '@/components/reports/DateHistorySection'
import GoalProgressList      from '@/components/reports/GoalProgressList'
import DailyTasksChart       from '@/components/reports/DailyTasksChart'
import ScheduleWeekChart     from '@/components/reports/ScheduleWeekChart'
import SlicePie              from '@/components/reports/SlicePie'
import { KpiGrid, ReportPanel, PanelGrid, EmptyNote, formatMinutes } from '@/components/reports/ReportBlocks'
import {
  BarChart2, RefreshCw, PieChart, Activity, Zap, CalendarDays, Target,
  Repeat2, ListChecks, CalendarClock, Flag,
} from 'lucide-react'
import Button from '@/components/ui/Button'

type Tab = 'day' | 'goals' | 'habits' | 'daily' | 'schedule'

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'day',      label: 'Día a día', icon: <CalendarDays size={14} />,  color: 'var(--amber)' },
  { id: 'goals',    label: 'Metas',     icon: <Target size={14} />,        color: 'var(--cyan)' },
  { id: 'habits',   label: 'Hábitos',   icon: <Repeat2 size={14} />,       color: 'var(--green)' },
  { id: 'daily',    label: 'Diarias',   icon: <ListChecks size={14} />,    color: 'var(--purple)' },
  { id: 'schedule', label: 'Horario',   icon: <CalendarClock size={14} />, color: 'var(--red)' },
]

const TAB_KEY = 'kronometa.reports.tab'

export default function ReportsPage() {
  const [data,       setData]       = useState<ReportsData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [tab,        setTab]        = useState<Tab>('day')
  const [dayKey,     setDayKey]     = useState(0)

  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'
  const padding  = isMobile ? '12px' : '24px 20px'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null
      if (saved && TABS.some(t => t.id === saved)) setTab(saved)
    } catch {}
    loadReports()
  }, [])

  function selectTab(t: Tab) {
    setTab(t)
    try { localStorage.setItem(TAB_KEY, t) } catch {}
  }

  async function loadReports() {
    setRefreshing(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setData(await getReportsData(user.id))
      setDayKey(k => k + 1)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div style={{ padding, maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: '12px', marginBottom: isMobile ? '12px' : '18px',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: '0 0 2px' }}>Reportes</h1>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            Cada área con su propio análisis
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
          onClick={loadReports}
        >
          {isMobile ? '' : 'Actualizar'}
        </Button>
      </div>

      {/* PESTAÑAS POR ÁREA */}
      <nav role="tablist" style={{
        display: 'flex', gap: '6px', overflowX: 'auto',
        padding: '4px', marginBottom: isMobile ? '14px' : '20px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', scrollbarWidth: 'none',
      }}>
        {TABS.map(t => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(t.id)}
              style={{
                flex: isMobile ? '0 0 auto' : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: isMobile ? '8px 12px' : '9px 14px',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                color: active ? t.color : 'var(--muted)',
                background: active ? '#ffffff0a' : 'transparent',
                border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                boxShadow: active ? `inset 0 -2px 0 ${t.color}` : 'none',
                transition: 'all var(--transition)',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </nav>

      {tab === 'day' && <DateHistorySection key={dayKey} isMobile={isMobile} />}

      {tab !== 'day' && (
        !data ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            cargando reportes...
          </div>
        ) : tab === 'goals'    ? <GoalsReport    data={data} isMobile={isMobile} />
          : tab === 'habits'   ? <HabitsReport   data={data} isMobile={isMobile} />
          : tab === 'daily'    ? <DailyReport    data={data} isMobile={isMobile} />
          :                      <ScheduleReport data={data} isMobile={isMobile} />
      )}
    </div>
  )
}

interface AreaProps { data: ReportsData; isMobile: boolean }

// ── METAS ────────────────────────────────────────────────────────────────────
function GoalsReport({ data, isMobile }: AreaProps) {
  const time     = useMemo(() => timeByArea(data, 'goal'), [data])
  const week     = useMemo(() => weeklyByArea(data, 'goal'), [data])
  const progress = useMemo(() => goalProgressOf(data), [data])

  const totalSecs = time.reduce((a, d) => a + d.totalSeconds, 0)
  const doneSubs  = progress.reduce((a, g) => a + g.completed, 0)
  const allSubs   = progress.reduce((a, g) => a + g.total, 0)

  return (
    <>
      <KpiGrid isMobile={isMobile} items={[
        { label: 'Tiempo en metas', value: formatTime(totalSecs), color: 'var(--cyan)' },
        { label: 'Metas activas',   value: progress.length,       color: 'var(--purple)' },
        { label: 'Submetas',        value: `${doneSubs}/${allSubs}`, hint: 'completadas', color: 'var(--green)' },
        { label: 'Meta con más tiempo', value: time[0] ? formatTime(time[0].totalSeconds) : '—', hint: time[0]?.title, color: time[0]?.color || 'var(--muted)' },
      ]} />
      <PanelGrid isMobile={isMobile}>
        <ReportPanel title="Distribución de tiempo" subtitle="Reparto del tiempo total entre tus metas" icon={<PieChart size={13} />} color="var(--cyan)" isMobile={isMobile}>
          <TimeByGoalChart data={time} emptyText="Inicia el cronómetro en una meta para ver su distribución." />
        </ReportPanel>
        <ReportPanel title="Tiempo por meta · velas" subtitle="Cada meta frente al promedio" icon={<BarChart2 size={13} />} color="var(--amber)" isMobile={isMobile}>
          <CandlestickChart data={time} emptyText="Aún no hay tiempo registrado en metas." />
        </ReportPanel>
        <ReportPanel title="Actividad semanal" subtitle="Tiempo en metas los últimos 7 días" icon={<Activity size={13} />} color="var(--purple)" isMobile={isMobile}>
          <WeeklyActivityChart data={week} emptyText="Sin tiempo en metas esta semana." />
        </ReportPanel>
        <ReportPanel title="Avance de submetas" subtitle="Progreso de cada meta" icon={<Flag size={13} />} color="var(--green)" isMobile={isMobile}>
          <GoalProgressList data={progress} />
        </ReportPanel>
      </PanelGrid>
    </>
  )
}

// ── HÁBITOS ──────────────────────────────────────────────────────────────────
function HabitsReport({ data, isMobile }: AreaProps) {
  const time        = useMemo(() => timeByArea(data, 'habit'), [data])
  const week        = useMemo(() => weeklyByArea(data, 'habit'), [data])
  const consistency = useMemo(() => habitConsistencyOf(data), [data])

  const totalSecs = time.reduce((a, d) => a + d.totalSeconds, 0)
  const avgPct    = consistency.length
    ? Math.round(consistency.reduce((a, h) => a + h.pct, 0) / consistency.length) : 0
  const best      = consistency[0]

  return (
    <>
      <KpiGrid isMobile={isMobile} items={[
        { label: 'Tiempo en hábitos', value: formatTime(totalSecs), color: 'var(--green)' },
        { label: 'Hábitos activos',   value: consistency.length,    color: 'var(--purple)' },
        { label: 'Consistencia',      value: `${avgPct}%`, hint: 'promedio 30 días', color: avgPct >= 70 ? 'var(--green)' : 'var(--amber)' },
        { label: 'Mejor hábito',      value: best ? `${best.pct}%` : '—', hint: best?.title, color: best?.color || 'var(--muted)' },
      ]} />
      <PanelGrid isMobile={isMobile}>
        <ReportPanel title="Distribución de tiempo" subtitle="Reparto del tiempo total entre tus hábitos" icon={<PieChart size={13} />} color="var(--green)" isMobile={isMobile}>
          <TimeByGoalChart data={time} emptyText="Inicia el cronómetro en un hábito para ver su distribución." />
        </ReportPanel>
        <ReportPanel title="Tiempo por hábito · velas" subtitle="Cada hábito frente al promedio" icon={<BarChart2 size={13} />} color="var(--amber)" isMobile={isMobile}>
          <CandlestickChart data={time} emptyText="Aún no hay tiempo registrado en hábitos." />
        </ReportPanel>
        <ReportPanel title="Actividad semanal" subtitle="Tiempo en hábitos los últimos 7 días" icon={<Activity size={13} />} color="var(--purple)" isMobile={isMobile}>
          <WeeklyActivityChart data={week} emptyText="Sin tiempo en hábitos esta semana." />
        </ReportPanel>
        <ReportPanel title="Consistencia · radar" subtitle="Días cumplidos en los últimos 30" icon={<Zap size={13} />} color="var(--green)" isMobile={isMobile}>
          <HabitConsistencyChart data={consistency} />
        </ReportPanel>
      </PanelGrid>
    </>
  )
}

// ── DIARIAS ──────────────────────────────────────────────────────────────────
function DailyReport({ data, isMobile }: AreaProps) {
  const stats = useMemo(() => dailyTaskStatsOf(data, 14), [data])
  const empty = stats.completed + stats.pending === 0

  return (
    <>
      <KpiGrid isMobile={isMobile} items={[
        { label: 'Hoy', value: `${stats.todayCompleted}/${stats.todayTotal}`, hint: 'completadas', color: 'var(--purple)' },
        { label: 'Cumplimiento', value: `${stats.rate}%`, hint: 'últimos 14 días', color: stats.rate >= 70 ? 'var(--green)' : 'var(--amber)' },
        { label: 'Completadas', value: stats.completed, hint: 'últimos 14 días', color: 'var(--green)' },
        { label: 'Mejor racha', value: `${stats.bestStreak}d`, hint: 'días con todo hecho', color: 'var(--amber)' },
      ]} />
      <PanelGrid isMobile={isMobile}>
        <ReportPanel title="Cumplimiento · torta" subtitle="Completadas frente a sin completar (14 días)" icon={<PieChart size={13} />} color="var(--purple)" isMobile={isMobile}>
          {empty ? <EmptyNote>Aún no tienes tareas diarias en los últimos 14 días.</EmptyNote> : (
            <SlicePie
              data={[
                { key: 'done',    label: 'Completadas',   value: stats.completed, color: '#00FF88' },
                { key: 'pending', label: 'Sin completar', value: stats.pending,   color: '#FF3860' },
              ]}
              format={v => `${v} ${v === 1 ? 'tarea' : 'tareas'}`}
              center={{ value: `${stats.rate}%`, label: 'CUMPLIDO' }}
            />
          )}
        </ReportPanel>
        <ReportPanel title="Tareas por día · barras" subtitle="Últimos 14 días" icon={<BarChart2 size={13} />} color="var(--green)" isMobile={isMobile}>
          {empty ? <EmptyNote>Sin tareas diarias registradas.</EmptyNote> : <DailyTasksChart data={stats.days} />}
        </ReportPanel>
      </PanelGrid>
    </>
  )
}

// ── HORARIO ──────────────────────────────────────────────────────────────────
function ScheduleReport({ data, isMobile }: AreaProps) {
  const stats   = useMemo(() => scheduleStatsOf(data), [data])
  const busiest = stats.byWeekday.reduce((a, b) => (b.minutes > a.minutes ? b : a), stats.byWeekday[0])
  const empty   = stats.blocks.length === 0

  return (
    <>
      <KpiGrid isMobile={isMobile} items={[
        { label: 'Bloques activos', value: stats.activeBlocks, color: 'var(--red)' },
        { label: 'Horas planificadas', value: formatMinutes(stats.totalMinutes), hint: 'por semana', color: 'var(--cyan)' },
        { label: 'Promedio por día', value: formatMinutes(stats.totalMinutes / 7), color: 'var(--purple)' },
        { label: 'Día más cargado', value: busiest && busiest.minutes > 0 ? busiest.label : '—', hint: busiest && busiest.minutes > 0 ? formatMinutes(busiest.minutes) : undefined, color: 'var(--amber)' },
      ]} />
      <PanelGrid isMobile={isMobile}>
        <ReportPanel title="Distribución semanal · torta" subtitle="Horas planificadas por bloque cada semana" icon={<PieChart size={13} />} color="var(--red)" isMobile={isMobile}>
          {empty ? <EmptyNote>Crea bloques en Horario para ver cómo repartes tu semana.</EmptyNote> : (
            <SlicePie
              data={stats.blocks.map(b => ({ key: b.id, label: b.title, value: b.weeklyMinutes, color: b.color }))}
              format={formatMinutes}
              center={{ value: formatMinutes(stats.totalMinutes), label: 'POR SEMANA' }}
            />
          )}
        </ReportPanel>
        <ReportPanel title="Carga por día · barras" subtitle="Horas planificadas de lunes a domingo" icon={<BarChart2 size={13} />} color="var(--purple)" isMobile={isMobile}>
          {empty ? <EmptyNote>Sin bloques de horario activos.</EmptyNote> : <ScheduleWeekChart data={stats.byWeekday} />}
        </ReportPanel>
      </PanelGrid>
    </>
  )
}
