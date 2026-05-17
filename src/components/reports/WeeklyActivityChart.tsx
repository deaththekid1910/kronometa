'use client'

import { DayActivity } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'

interface Props { data: DayActivity[] }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const secs = payload[0]?.payload?.seconds || 0
  return (
    <div style={{
      background: '#0f0f1a', border: '1px solid #00F5FF33',
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: '0 0 20px #00F5FF22',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{formatTime(secs)}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{payload[0]?.payload?.sessions || 0} sesiones</div>
    </div>
  )
}

export default function WeeklyActivityChart({ data }: Props) {
  const hasData   = data.some(d => d.seconds > 0)
  const maxSecs   = Math.max(...data.map(d => d.seconds), 1)
  const totalSecs = data.reduce((a, d) => a + d.seconds, 0)
  const avgSecs   = Math.round(totalSecs / 7)
  const bestDay   = data.reduce((a, b) => a.seconds > b.seconds ? a : b)

  const chartData = data.map(d => ({
    ...d,
    minutes: Math.round(d.seconds / 60),
    intensity: Math.round((d.seconds / maxSecs) * 100),
  }))

  if (!hasData) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin actividad esta semana aún.
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Total semana', value: formatTime(totalSecs), color: 'var(--cyan)' },
          { label: 'Promedio/día', value: formatTime(avgSecs),   color: 'var(--purple)' },
          { label: 'Mejor día',    value: bestDay.label,         color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#ffffff05', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#B026FF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#B026FF" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F293744" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff04' }} />
          <Bar dataKey="minutes" fill="url(#barGrad)" radius={[6,6,0,0]} maxBarSize={40} animationDuration={1000}>
            {chartData.map((d, i) => (
              <Cell key={i}
                fill={d.seconds === maxSecs ? '#00F5FF' : 'url(#barGrad)'}
                style={{ filter: d.seconds === maxSecs ? 'drop-shadow(0 0 8px #00F5FF88)' : 'none' }}
              />
            ))}
          </Bar>
          <Line
            type="monotone" dataKey="minutes"
            stroke="#00FF88" strokeWidth={2} dot={false}
            strokeDasharray="4 4"
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}