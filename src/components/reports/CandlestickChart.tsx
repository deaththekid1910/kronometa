'use client'

import { GoalTimeData } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

interface Props { data: GoalTimeData[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: '#0f0f1a', border: `1px solid ${d.color}66`,
      borderRadius: '10px', padding: '10px 14px',
      boxShadow: `0 0 20px ${d.color}33`,
    }}>
      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{d.title}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: d.color }}>{formatTime(d.totalSeconds)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Tipo:</span>
        <span style={{ fontSize: '10px', color: d.color }}>{d.type === 'habit' ? 'Hábito' : 'Meta'}</span>
      </div>
    </div>
  )
}

export default function CandlestickChart({ data }: Props) {
  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin datos de tiempo aún.
    </div>
  )

  const avg = Math.round(data.reduce((a, d) => a + d.totalSeconds, 0) / data.length)

  const chartData = data.map(d => ({
    ...d,
    minutes: Math.round(d.totalSeconds / 60),
    aboveAvg: d.totalSeconds >= avg,
  }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', background: 'var(--cyan)', borderRadius: '2px' }} />
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Sobre promedio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '3px', background: 'var(--purple)', borderRadius: '2px' }} />
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Bajo promedio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '2px', background: 'var(--amber)', borderRadius: '2px', borderTop: '2px dashed var(--amber)' }} />
          <span style={{ fontSize: '11px', color: 'var(--amber)' }}>Promedio: {formatTime(avg)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barSize={28}>
          <XAxis
            dataKey="title" tick={{ fill: 'var(--muted)', fontSize: 10 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => v.length > 8 ? v.slice(0, 8) + '…' : v}
          />
          <YAxis
            tick={{ fill: 'var(--muted)', fontSize: 11 }}
            axisLine={false} tickLine={false}
            tickFormatter={v => `${v}m`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff04' }} />
          <ReferenceLine
            y={Math.round(avg / 60)}
            stroke="#FFB800" strokeDasharray="4 4" strokeWidth={1.5}
          />
          <Bar dataKey="minutes" radius={[6,6,0,0]} animationDuration={1000}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={d.aboveAvg ? '#00F5FF' : '#B026FF'}
                fillOpacity={0.85}
                style={{ filter: `drop-shadow(0 0 6px ${d.aboveAvg ? '#00F5FF' : '#B026FF'}66)` }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}