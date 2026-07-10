'use client'

import { ReactNode } from 'react'
import AnimatedNumber from './AnimatedNumber'

interface Props {
  icon: ReactNode
  label: string
  value: number
  format?: 'number' | 'time' | 'percent'
  suffix?: string
  subtitle?: string
  color: string
  onClick?: () => void
}

export default function StatCard({ icon, label, value, format = 'number', suffix, subtitle, color, onClick }: Props) {
  return (
    <div
      className="km-card-appear"
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`, borderRadius: 'var(--radius-lg)',
        padding: '16px 18px', position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default', transition: 'all 250ms ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform   = 'translateY(-3px)'
        el.style.boxShadow   = `0 16px 32px -10px ${color}40`
        el.style.borderColor = `${color}55`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = 'none'
        el.style.borderColor = `${color}30`
      }}
    >
      <div style={{
        position: 'absolute', top: '-16px', right: '-16px', fontSize: '5.5rem',
        opacity: 0.07, pointerEvents: 'none', color,
      }}>
        {icon}
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '11px', marginBottom: '10px' }}>
          <span style={{
            width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
            background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          }}>
            {icon}
          </span>
          {label}
        </div>

        <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-mono)', color, lineHeight: 1, marginBottom: '4px' }}>
          <AnimatedNumber value={value} format={format} />{suffix}
        </div>

        {subtitle && (
          <div style={{ fontSize: '11px', color: 'var(--dim)' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
