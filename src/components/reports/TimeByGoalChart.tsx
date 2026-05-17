'use client'

import { GoalTimeData } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

interface Props {
  data: GoalTimeData[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as GoalTimeData
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${d.color}44`,
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: `0 0 20px ${d.color}22`,
    }}>
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>{d.title}</div>
      <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: d.color }}>
        {formatTime(d.totalSeconds)}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
        {d.type === 'habit' ? 'Hábito' : 'Meta'}
      </div>
    </div>
  )
}

export default function TimeByGoalChart({ data }: Props) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin datos de tiempo aún. Activa un cronómetro para empezar.
    </div>
  )

  const chartData = data.map(d => ({
    ...d,
    minutes: Math.round(d.totalSeconds / 60),
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} barSize={32} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="title"
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
          />
          <YAxis
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}m`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff06' }} />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {data.map(d => (
          <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 6px ${d.color}88` }} />
            <span style={{ fontSize: '12px', flex: 1, color: 'var(--text)' }}>{d.title}</span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: d.color }}>{formatTime(d.totalSeconds)}</span>
            <div style={{ width: '80px', height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((d.totalSeconds / data[0].totalSeconds) * 100)}%`,
                background: d.color, borderRadius: '4px',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}