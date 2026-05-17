import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ReactNode
  loading?: boolean
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--cyan)',
    color: '#0A0E1A',
    border: 'none',
    fontWeight: 600,
  },
  secondary: {
    background: '#00F5FF0D',
    color: 'var(--cyan)',
    border: '1px solid #00F5FF30',
    fontWeight: 500,
  },
  ghost: {
    background: 'transparent',
    color: 'var(--muted)',
    border: '1px solid var(--border)',
    fontWeight: 400,
  },
  danger: {
    background: '#FF38600D',
    color: 'var(--red)',
    border: '1px solid #FF386030',
    fontWeight: 500,
  },
}

const sizes: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: 'var(--radius-sm)' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-sm)' },
  lg: { padding: '11px 22px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  style,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all var(--transition)',
        opacity: (loading || props.disabled) ? 0.5 : 1,
        cursor: (loading || props.disabled) ? 'not-allowed' : 'pointer',
        ...styles[variant],
        ...sizes[size],
        ...style,
      }}
    >
      {loading ? <span style={{ fontSize: '12px' }}>⟳</span> : icon}
      {children}
    </button>
  )
}