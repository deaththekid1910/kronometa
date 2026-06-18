'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  getTimeByGoal, getWeeklyActivity, getHabitConsistency,
  GoalTimeData, DayActivity, HabitConsistency
} from '@/lib/reports'
import TimeByGoalChart       from '@/components/reports/TimeByGoalChart'
import WeeklyActivityChart   from '@/components/reports/WeeklyActivityChart'
import HabitConsistencyChart from '@/components/reports/HabitConsistencyChart'
import CandlestickChart      from '@/components/reports/CandlestickChart'
import DateHistorySection    from '@/components/reports/DateHistorySection'
import { BarChart2, RefreshCw, PieChart, Activity, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ReportsPage() {
  const [timeData,   setTimeData]   = useState<GoalTimeData[]>([])
  const [weekData,   setWeekData]   = useState<DayActivity[]>([])
  const [habitData,  setHabitData]  = useState<HabitConsistency[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const bp          = useBreakpoint()
  const isMobile    = bp === 'mobile'
  const isTablet    = bp === 'tablet'
  const padding     = isMobile ? '12px' : '24px 20px'
  const statsGrid   = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(5,1fr)'
  const chartsGrid  = isMobile ? '1fr' : '1fr 1fr'

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    setRefreshing(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [time, week, habits] = await Promise.all([
      getTimeByGoal(user.id),
      getWeeklyActivity(user.id),
      getHabitConsistency(user.id),
    ])
    setTimeData(time)
    setWeekData(week)
    setHabitData(habits)
    setLoading(false)
    setRefreshing(false)
  }

  const totalSecs   = timeData.reduce((a, d) => a + d.totalSeconds, 0)
  const totalHours  = (totalSecs / 3600).toFixed(1)
  const topGoal     = timeData[0]
  const habitAvgPct = habitData.length > 0
    ? Math.round(habitData.reduce((a, h) => a + h.pct, 0) / habitData.length)
    : 0

  const panels = [
    { title: 'DISTRIBUCIÓN · TORTA',         icon: <PieChart size={13} />,  color: 'var(--cyan)',   chart: <TimeByGoalChart data={timeData} /> },
    { title: 'ACTIVIDAD SEMANAL · BARRAS',   icon: <Activity size={13} />,  color: 'var(--purple)', chart: <WeeklyActivityChart data={weekData} /> },
    { title: 'TIEMPO POR META · VELAS',      icon: <BarChart2 size={13} />, color: 'var(--amber)',  chart: <CandlestickChart data={timeData} /> },
    { title: 'CONSISTENCIA HÁBITOS · RADAR', icon: <Zap size={13} />,       color: 'var(--green)',  chart: <HabitConsistencyChart data={habitData} /> },
  ]

  const stats = [
    { label: 'Horas totales', value: `${totalHours}h`,  color: 'var(--cyan)' },
    { label: 'Metas activas', value: timeData.filter(d => d.type === 'goal').length, color: 'var(--purple)' },
    { label: 'Consistencia',  value: `${habitAvgPct}%`, color: habitAvgPct >= 70 ? 'var(--green)' : 'var(--amber)' },
    { label: 'Meta top',      value: topGoal?.title.slice(0, 10) + (topGoal && topGoal.title.length > 10 ? '…' : '') || '—', color: topGoal?.color || 'var(--muted)' },
    { label: 'Mejor hábito',  value: habitData[0]?.title.slice(0, 10) + (habitData[0] && habitData[0].title.length > 10 ? '…' : '') || '—', color: 'var(--green)' },
  ]

  return (
    <div style={{ padding }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: isMobile ? '14px' : '20px',
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: '0 0 2px' }}>
            Reportes
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            {isMobile ? 'Tu tiempo y consistencia' : 'Análisis completo de tu tiempo y consistencia'}
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

      {/* STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: statsGrid,
        gap: isMobile ? '8px' : '10px',
        marginBottom: isMobile ? '14px' : '20px',
      }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: isMobile ? '11px 12px' : '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
              {s.label}
            </div>
            <div style={{
              fontSize: isMobile ? '15px' : '17px',
              fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color,
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* HISTORIAL POR FECHA */}
      <DateHistorySection isMobile={isMobile} />

      {/* GRÁFICAS */}
      {loading ? (
        <div style={{
          textAlign: 'center', padding: '4rem',
          color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px',
        }}>
          cargando reportes...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: chartsGrid, gap: isMobile ? '10px' : '16px' }}>
          {panels.map(p => (
            <div key={p.title} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? '14px' : '20px',
              minWidth: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: isMobile ? '12px' : '16px',
              }}>
                <span style={{ color: p.color, flexShrink: 0 }}>{p.icon}</span>
                <span style={{
                  fontSize: isMobile ? '10px' : '11px',
                  color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500,
                }}>
                  {isMobile ? p.title.split('·')[0].trim() : p.title}
                </span>
              </div>
              {p.chart}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}