'use client'

import { HabitConsistency } from '@/lib/reports'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

interface Props { data: HabitConsistency[] }

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#0f0f1a', border: '1px solid #00FF8833',
      borderRadius: '10px', padding: '10px 14px',
    }}>
      <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '2px' }}>
        {payload[0]?.payload?.title}
      </div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
        {payload[0]?.value}%
      </div>
    </div>
  )
}

export default function HabitConsistencyChart({ data }: Props) {
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  if (data.length === 0) return (
    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontSize: '13px' }}>
      Sin hábitos registrados aún.
    </div>
  )

  const radarH = isMobile ? 180 : 220

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', minWidth: 0 }}>

      {/* RADAR — siempre arriba, ancho controlado */}
      <div style={{ width: '100%', height: `${radarH}px`, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%">
            <PolarGrid stroke="#1F2937" />
            <PolarAngleAxis
              dataKey="title"
              tick={{ fill: 'var(--muted)', fontSize: isMobile ? 9 : 10 }}
              tickFormatter={v => v.length > 6 ? v.slice(0, 6) + '…' : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              dataKey="pct"
              name="Consistencia"
              stroke="#00FF88"
              fill="#00FF88"
              fillOpacity={0.15}
              strokeWidth={2}
              animationDuration={1200}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* LISTA — siempre en columna */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', minWidth: 0 }}>
        {data.map(h => (
          <div key={h.id} style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '5px', gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: h.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${h.color}`,
                }} />
                <span style={{
                  fontSize: '12px', color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{h.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {h.completedDays}/{h.totalDays}d
                </span>
                <span style={{
                  fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: h.pct >= 70 ? 'var(--green)' : h.pct >= 40 ? 'var(--amber)' : 'var(--red)',
                  minWidth: '36px', textAlign: 'right',
                }}>{h.pct}%</span>
              </div>
            </div>

            {/* BARRA */}
            <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '5px' }}>
              <div style={{
                height: '100%', width: `${h.pct}%`,
                background: h.pct >= 70
                  ? 'linear-gradient(90deg,#00FF88,#00FF8888)'
                  : h.pct >= 40
                  ? 'linear-gradient(90deg,#FFB800,#FFB80088)'
                  : 'linear-gradient(90deg,#FF3860,#FF386088)',
                borderRadius: '6px',
                boxShadow: h.pct >= 70 ? '0 0 8px #00FF8866' : 'none',
                transition: 'width 1s ease',
              }} />
            </div>

            {/* DOTS — con flex-wrap para no desbordar */}
            <div style={{
              display: 'flex', gap: '2px', flexWrap: 'wrap',
              maxWidth: '100%', overflow: 'hidden',
            }}>
              {Array.from({ length: h.totalDays }).map((_, i) => (
                <div key={i} style={{
                  width: isMobile ? '8px' : '9px',
                  height: isMobile ? '8px' : '9px',
                  borderRadius: '2px',
                  flexShrink: 0,
                  background: i < h.completedDays ? h.color : 'var(--border)',
                  opacity: i < h.completedDays ? 0.9 : 0.3,
                  boxShadow: i < h.completedDays ? `0 0 4px ${h.color}66` : 'none',
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}