import React from 'react'

type Color = 'cyan' | 'purple' | 'green' | 'amber' | 'red' | 'gray'

interface Props {
  color?: Color
  children: React.ReactNode
  dot?: boolean
  pulse?: boolean
}

const colors: Record<Color, { bg: string; text: string; border: string }> = {
  cyan:   { bg: '#00F5FF12', text: 'var(--cyan)',   border: '#00F5FF30' },
  purple: { bg: '#B026FF12', text: 'var(--purple)', border: '#B026FF30' },
  green:  { bg: '#00FF8812', text: 'var(--green)',  border: '#00FF8830' },
  amber:  { bg: '#FFB80012', text: 'var(--amber)',  border: '#FFB80030' },
  red:    { bg: '#FF386012', text: 'var(--red)',    border: '#FF386030' },
  gray:   { bg: '#ffffff08', text: 'var(--muted)',  border: 'var(--border)' },
}

export default function Badge({ color = 'gray', children, dot = false, pulse = false }: Props) {
  const c = colors[color]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 500,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
    }}>
      {dot && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: c.text, flexShrink: 0,
          animation: pulse ? 'pulse-dot 1.4s infinite' : 'none',
        }} />
      )}
      {children}
    </span>
  )
}