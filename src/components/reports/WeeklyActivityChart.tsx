'use client'

import { DayActivity } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

interface Props {
  data: DayActivity[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid #00F5FF33',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
        {formatTime(payload[0]?.payload?.seconds || 0)}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
        {payload[0]?.payload?.sessions || 0} sesiones
      </div>
    </div>
  )
}

export default function WeeklyActivityChart({ data }: Props) {
  const hasData = data.some(d => d.seconds > 0)

  if (!hasData) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin actividad esta semana aún.
    </div>
  )

  const chartData = data.map(d => ({
    ...d,
    minutes: Math.round(d.seconds / 60),
  }))

  const totalSecs  = data.reduce((a, d) => a + d.seconds, 0)
  const avgSecs    = Math.round(totalSecs / 7)
  const bestDay    = data.reduce((a, b) => a.seconds > b.seconds ? a : b)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Total semana', value: formatTime(totalSecs), color: 'var(--cyan)' },
          { label: 'Promedio/día', value: formatTime(avgSecs),   color: 'var(--purple)' },
          { label: 'Mejor día',    value: bestDay.label,         color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#ffffff05', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}m`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="minutes"
            stroke="#00F5FF" strokeWidth={2}
            fill="url(#cyanGrad)"
            dot={{ fill: '#00F5FF', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: '#00F5FF', stroke: '#00F5FF', strokeWidth: 3, strokeOpacity: 0.4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}