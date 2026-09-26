'use client'

import { DailyTaskDay } from '@/lib/reports'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface Props { data: DailyTaskDay[] }

const DONE    = '#00FF88'
const PENDING = '#FF3860'

function DayTooltip({ active, payload }: { active?: boolean; payload?: { payload: DailyTaskDay }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DailyTaskDay
  const total = d.completed + d.pending
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #00FF8833', borderRadius: '10px', padding: '10px 14px' }}>
      <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
        {new Date(d.date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })}
      </div>
      <div style={{ fontSize: '12px', color: DONE }}>{d.completed} completadas</div>
      <div style={{ fontSize: '12px', color: PENDING }}>{d.pending} sin completar</div>
      {total > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
          {Math.round((d.completed / total) * 100)}% cumplido
        </div>
      )}
    </div>
  )
}

// Barras apiladas: completadas vs sin completar por día
export default function DailyTasksChart({ data }: Props) {
  const chartData = data.map(d => ({ ...d, tick: `${d.label} ${Number(d.date.slice(8))}` }))

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {[{ c: DONE, l: 'Completadas' }, { c: PENDING, l: 'Sin completar' }].map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: x.c }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{x.l}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F293744" vertical={false} />
          <XAxis dataKey="tick" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false}
            interval="preserveStartEnd" minTickGap={8} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DayTooltip />} cursor={{ fill: '#ffffff04' }} />
          <Bar dataKey="completed" stackId="t" fill={DONE}    fillOpacity={0.85} maxBarSize={28} animationDuration={900} />
          <Bar dataKey="pending"   stackId="t" fill={PENDING} fillOpacity={0.6}  maxBarSize={28} radius={[6, 6, 0, 0]} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
