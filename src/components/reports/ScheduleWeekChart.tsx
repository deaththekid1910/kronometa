'use client'

import { ScheduleStats } from '@/lib/reports'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { formatMinutes } from './ReportBlocks'

interface Props { data: ScheduleStats['byWeekday'] }

function WeekTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScheduleStats['byWeekday'][number] }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #B026FF44', borderRadius: '10px', padding: '10px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{d.label}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--purple)' }}>{formatMinutes(d.minutes)}</div>
    </div>
  )
}

// Horas planificadas por día de la semana (Lunes → Domingo)
export default function ScheduleWeekChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.minutes), 1)
  const chartData = data.map(d => ({ ...d, hours: +(d.minutes / 60).toFixed(1) }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1F293744" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
        <Tooltip content={<WeekTooltip />} cursor={{ fill: '#ffffff04' }} />
        <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={900}>
          {chartData.map(d => (
            <Cell key={d.day}
              fill={d.minutes === max ? '#00F5FF' : '#B026FF'}
              fillOpacity={0.85}
              style={{ filter: d.minutes === max ? 'drop-shadow(0 0 8px #00F5FF88)' : 'none' }} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
