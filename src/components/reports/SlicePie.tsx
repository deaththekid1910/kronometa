'use client'

import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export interface Slice {
  key: string
  label: string
  value: number
  color: string
}

interface Props {
  data: Slice[]
  format: (v: number) => string
  center?: { value: string; label: string }
}

function SliceTooltip({ active, payload, format }: { active?: boolean; payload?: { payload: Slice }[]; format: (v: number) => string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as Slice
  return (
    <div style={{
      background: '#0f0f1a', border: `1px solid ${d.color}66`,
      borderRadius: '10px', padding: '10px 14px', boxShadow: `0 0 20px ${d.color}33`,
    }}>
      <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', color: 'var(--text)' }}>{d.label}</div>
      <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: d.color }}>{format(d.value)}</div>
    </div>
  )
}

// Torta con dona + leyenda en lista (valor y %), usada por Diarias y Horario
export default function SlicePie({ data, format, center }: Props) {
  const isMobile = useBreakpoint() === 'mobile'
  const total    = data.reduce((a, d) => a + d.value, 0) || 1
  const visible  = data.filter(d => d.value > 0)
  const size     = isMobile ? 170 : 200

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
      <div style={{ width: '100%', height: `${size}px`, position: 'relative', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible} dataKey="value" nameKey="label"
              cx="50%" cy="50%"
              innerRadius={isMobile ? 48 : 58} outerRadius={isMobile ? 72 : 88}
              paddingAngle={visible.length > 1 ? 2 : 0}
              animationDuration={1000}
            >
              {visible.map(d => (
                <Cell key={d.key} fill={d.color} stroke="transparent"
                  style={{ filter: `drop-shadow(0 0 6px ${d.color}88)` }} />
              ))}
            </Pie>
            <Tooltip content={props => <SliceTooltip {...(props as object)} format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
              {center.value}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.5px' }}>{center.label}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map(d => (
          <div key={d.key} style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', background: d.color,
              boxShadow: `0 0 6px ${d.color}`, flexShrink: 0, transform: 'translateY(-1px)',
            }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: '12px', color: 'var(--text)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {d.label}
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: d.color, whiteSpace: 'nowrap' }}>
              {format(d.value)}
              <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>{Math.round((d.value / total) * 100)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
