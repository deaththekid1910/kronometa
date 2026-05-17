'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  getTimeByGoal, getWeeklyActivity, getHabitConsistency,
  GoalTimeData, DayActivity, HabitConsistency
} from '@/lib/reports'
import TimeByGoalChart      from '@/components/reports/TimeByGoalChart'
import WeeklyActivityChart  from '@/components/reports/WeeklyActivityChart'
import HabitConsistencyChart from '@/components/reports/HabitConsistencyChart'
import CandlestickChart     from '@/components/reports/CandlestickChart'
import { formatTime } from '@/lib/timer'
import { BarChart2, RefreshCw, PieChart, Activity, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function ReportsPage() {
  const [timeData,   setTimeData]   = useState<GoalTimeData[]>([])
  const [weekData,   setWeekData]   = useState<DayActivity[]>([])
  const [habitData,  setHabitData]  = useState<HabitConsistency[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  const panel = (
    title: string,
    icon: React.ReactNode,
    iconColor: string,
    children: React.ReactNode,
    fullWidth = false
  ) => (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '20px',
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ color: iconColor }}>{icon}</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ padding: '24px 20px' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>Reportes</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Análisis completo de tu tiempo y consistencia</p>
        </div>
        <Button
          variant="ghost" size="sm"
          icon={<RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
          onClick={loadReports}
        >
          Actualizar
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Horas totales',   value: `${totalHours}h`,    color: 'var(--cyan)' },
          { label: 'Metas activas',   value: timeData.filter(d => d.type === 'goal').length, color: 'var(--purple)' },
          { label: 'Consistencia',    value: `${habitAvgPct}%`,   color: habitAvgPct >= 70 ? 'var(--green)' : 'var(--amber)' },
          { label: 'Meta top',        value: topGoal?.title.slice(0,10) + (topGoal && topGoal.title.length > 10 ? '…' : '') || '—', color: topGoal?.color || 'var(--muted)' },
          { label: 'Mejor hábito',    value: habitData[0]?.title.slice(0,10) + (habitData[0] && habitData[0].title.length > 10 ? '…' : '') || '—', color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '17px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando reportes...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {panel('DISTRIBUCIÓN DE TIEMPO · TORTA', <PieChart size={14} />, 'var(--cyan)', <TimeByGoalChart data={timeData} />, false)}

          {panel('ACTIVIDAD SEMANAL · BARRAS + LÍNEA', <Activity size={14} />, 'var(--purple)', <WeeklyActivityChart data={weekData} />, false)}

          {panel('TIEMPO POR META · VELAS', <BarChart2 size={14} />, 'var(--amber)', <CandlestickChart data={timeData} />, false)}

          {panel('CONSISTENCIA DE HÁBITOS · RADAR', <Zap size={14} />, 'var(--green)', <HabitConsistencyChart data={habitData} />, false)}

        </div>
      )}
    </div>
  )
}