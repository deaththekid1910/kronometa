'use client'

import { memo, useEffect, useRef } from 'react'
import { useCountdownTicker } from '@/hooks/useCountdownTicker'
import { getColorPalette, getUrgencyLevel, urgencyColor, withAlpha, UrgencyLevel } from '@/lib/colorPalette'

type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Variant = 'default' | 'hero' | 'compact'

interface Props {
  targetDate?: string | null   // ISO UTC, ej. goal.deadline
  startDate?: string | null    // ISO UTC de referencia (ej. goal.created_at) para calcular % restante
  color: string
  size?: Size
  variant?: Variant
  onExpire?: () => void
  showLabels?: boolean
  animated?: boolean
}

interface Breakdown { days: number; hours: number; minutes: number; seconds: number }

function breakdown(ms: number): Breakdown {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days:    Math.floor(total / 86400),
    hours:   Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const URGENCY_CLASS: Record<UrgencyLevel, string> = {
  normal:   '',
  warning:  'km-countdown-warning',
  critical: 'km-countdown-critical',
  urgent:   'km-countdown-urgent',
  expired:  '',
}

const SIZE_NUM: Record<Size, number> = { xs: 14, sm: 18, md: 26, lg: 38, xl: 52 }
const SIZE_LBL: Record<Size, number> = { xs: 7,  sm: 8,  md: 9,  lg: 10, xl: 11 }
const SIZE_GAP: Record<Size, number> = { xs: 4,  sm: 6,  md: 10, lg: 14, xl: 18 }

function Countdown({
  targetDate, startDate, color,
  size = 'md', variant = 'default',
  onExpire, showLabels = true, animated = true,
}: Props) {
  const now = useCountdownTicker()
  const firedExpireRef = useRef(false)

  const targetMs = targetDate ? new Date(targetDate).getTime() : NaN
  const valid    = targetDate != null && !Number.isNaN(targetMs)

  const startMs      = startDate ? new Date(startDate).getTime() : null
  const msRemaining  = valid ? targetMs - now : 0
  const expired      = valid && msRemaining <= 0
  const pctRemaining = (valid && startMs !== null && targetMs > startMs)
    ? Math.max(0, msRemaining) / (targetMs - startMs)
    : null

  useEffect(() => {
    if (!valid) return
    if (expired && !firedExpireRef.current) {
      firedExpireRef.current = true
      onExpire?.()
    }
    if (!expired) firedExpireRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, valid])

  if (!valid) return null

  const palette = getColorPalette(color)
  const level   = getUrgencyLevel(msRemaining, pctRemaining)
  const uColor  = urgencyColor(palette, level)
  const { days, hours, minutes, seconds } = breakdown(msRemaining)

  if (expired) return <ExpiredBadge variant={variant} size={size} color={uColor} />

  const glowClass = animated ? URGENCY_CLASS[level] : ''

  if (variant === 'hero') {
    return (
      <HeroCountdown
        days={days} hours={hours} minutes={minutes} seconds={seconds}
        color={uColor} showLabels={showLabels} animated={animated} glowClass={glowClass}
      />
    )
  }

  if (variant === 'compact') {
    return (
      <CompactCountdown
        days={days} hours={hours} minutes={minutes} seconds={seconds}
        color={uColor}
      />
    )
  }

  return (
    <DefaultCountdown
      days={days} hours={hours} minutes={minutes} seconds={seconds}
      color={uColor} size={size} showLabels={showLabels}
    />
  )
}

export default memo(Countdown)

// ── VENCIDA ──────────────────────────────────────────────────────────────

function ExpiredBadge({ variant, size, color }: { variant: Variant; size: Size; color: string }) {
  const fontSize = variant === 'hero' ? '18px' : variant === 'compact' ? '11px' : `${SIZE_NUM[size] * 0.4}px`
  return (
    <div className="km-countdown-expired" style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: variant === 'hero' ? '10px 20px' : '4px 10px',
      borderRadius: '999px', background: withAlpha(color, 0.15),
      border: `1px solid ${withAlpha(color, 0.5)}`, color,
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize,
      letterSpacing: '0.5px',
    }}>
      ⏱ VENCIDA
    </div>
  )
}

// ── HERO — 4 bloques grandes con flip digit ────────────────────────────────

function HeroCountdown({
  days, hours, minutes, seconds, color, showLabels, animated, glowClass,
}: Breakdown & { color: string; showLabels: boolean; animated: boolean; glowClass: string }) {
  const units: [number, string][] = [
    [days, 'DÍAS'], [hours, 'HORAS'], [minutes, 'MIN'], [seconds, 'SEG'],
  ]

  return (
    <div
      className={glowClass}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '4px', flexWrap: 'wrap',
        ['--km-glow' as string]: withAlpha(color, 0.6),
      }}
    >
      {units.map(([value, label], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              minWidth: '64px', padding: '10px 6px', textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              background: withAlpha(color, 0.12),
              border: `1px solid ${withAlpha(color, 0.4)}`,
              backdropFilter: 'blur(6px)',
              overflow: 'hidden',
            }}>
              <span
                key={value}
                className={animated ? 'km-countdown-digit' : undefined}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                  fontWeight: 700, color, lineHeight: 1,
                }}
              >
                {String(value).padStart(2, '0')}
              </span>
            </div>
            {showLabels && (
              <span style={{
                fontSize: '10px', letterSpacing: '1.5px', color: 'var(--muted)', fontWeight: 600,
              }}>
                {label}
              </span>
            )}
          </div>
          {i < units.length - 1 && (
            <span className="km-countdown-colon" style={{
              fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)', fontWeight: 700, color,
              marginBottom: showLabels ? '22px' : '0', opacity: 0.6,
            }}>:</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── DEFAULT — anillos circulares por unidad ────────────────────────────────

function Ring({ value, max, color, size, children }: {
  value: number; max: number; color: string; size: number; children: React.ReactNode
}) {
  const r = size / 2 - 3
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={withAlpha(color, 0.15)} strokeWidth={3} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  )
}

function DefaultCountdown({ days, hours, minutes, seconds, color, size, showLabels }: Breakdown & {
  color: string; size: Size; showLabels: boolean
}) {
  const ringSize = size === 'xl' ? 64 : size === 'lg' ? 56 : size === 'sm' ? 40 : 48
  const numFont  = SIZE_NUM[size] * 0.42

  const units: [number, number, string][] = [
    [days, Math.max(days, 30), 'd'], [hours, 24, 'h'], [minutes, 60, 'm'], [seconds, 60, 's'],
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SIZE_GAP[size] }}>
      {units.map(([value, max, label]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Ring value={value} max={max} color={color} size={ringSize}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontWeight: 700, color,
              fontSize: `${numFont}px`,
            }}>{value}</span>
          </Ring>
          {showLabels && (
            <span style={{ fontSize: `${SIZE_LBL[size]}px`, color: 'var(--muted)', letterSpacing: '0.5px' }}>
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── COMPACT — una línea ─────────────────────────────────────────────────────

function CompactCountdown({ days, hours, minutes, seconds, color }: Breakdown & { color: string }) {
  const parts = days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : hours > 0
      ? `${hours}h ${minutes}m ${seconds}s`
      : `${minutes}m ${seconds}s`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: color, boxShadow: `0 0 6px ${withAlpha(color, 0.7)}`, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color,
      }}>
        {parts} restantes
      </span>
    </div>
  )
}
