'use client'

import { GoalTimeData } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Props { data: GoalTimeData[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as GoalTimeData
  return (
    <div style={{
      background: '#0f0f1a', border: `1px solid ${d.color}66`,
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: `0 0 20px ${d.color}33`,
    }}>
      <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--text)' }}>{d.title}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: d.color }}>{formatTime(d.totalSeconds)}</div>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{d.type === 'habit' ? 'Hábito' : 'Meta'}</div>
    </div>
  )
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#0A0E1A" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700} fontFamily="JetBrains Mono, monospace">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function TimeByGoalChart({ data }: Props) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Activa un cronómetro para ver distribución de tiempo.
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ flex: '0 0 200px', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} cx="50%" cy="50%"
              innerRadius={55} outerRadius={90}
              dataKey="totalSeconds"
              labelLine={false}
              label={<CustomLabel />}
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} stroke={d.color} strokeWidth={0}
                  style={{ filter: `drop-shadow(0 0 6px ${d.color}88)` }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((d, i) => (
          <div key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                <span style={{ fontSize: '12px', color: 'var(--text)' }}>{d.title}</span>
              </div>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: d.color }}>{formatTime(d.totalSeconds)}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.round((d.totalSeconds / data[0].totalSeconds) * 100)}%`,
                background: `linear-gradient(90deg, ${d.color}66, ${d.color})`,
                borderRadius: '4px',
                boxShadow: `0 0 8px ${d.color}66`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}