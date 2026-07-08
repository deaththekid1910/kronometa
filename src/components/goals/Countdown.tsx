'use client'

import { memo, useEffect, useRef } from 'react'
import { useCountdownTicker } from '@/hooks/useCountdownTicker'
import { getColorPalette, getUrgencyLevel, urgencyColor, withAlpha, ColorPalette, UrgencyLevel } from '@/lib/colorPalette'

type Size    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Variant = 'default' | 'hero' | 'compact' | 'card'

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

  const level    = getUrgencyLevel(msRemaining, pctRemaining)
  const uColor   = urgencyColor(getColorPalette(color), level)
  const palette  = getColorPalette(uColor)
  const brk      = breakdown(msRemaining)
  const glowClass = animated ? URGENCY_CLASS[level] : ''

  if (expired) return <ExpiredBadge variant={variant} />

  if (variant === 'hero')    return <HeroCountdown {...brk} palette={palette} showLabels={showLabels} glowClass={glowClass} level={level} />
  if (variant === 'card')    return <CardCountdown {...brk} palette={palette} glowClass={glowClass} level={level} />
  if (variant === 'compact') return <CompactCountdown {...brk} color={uColor} />
  return <DetailCountdown {...brk} palette={palette} size={size} showLabels={showLabels} glowClass={glowClass} />
}

export default memo(Countdown)

// ── VENCIDA ──────────────────────────────────────────────────────────────

function ExpiredBadge({ variant }: { variant: Variant }) {
  const big = variant === 'hero' || variant === 'default'
  return (
    <div className="km-countdown-expired" style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: big ? '12px 24px' : '6px 14px',
      borderRadius: '999px',
      background: 'linear-gradient(135deg, #DC2626 0%, #7F1D1D 100%)',
      color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 800,
      fontSize: big ? '15px' : '11px', letterSpacing: '1px',
      boxShadow: '0 6px 20px rgba(220,38,38,0.45)',
    }}>
      ⚠️ VENCIDA
    </div>
  )
}

// ── HERO — bloques gigantes con fondo sólido en gradiente ─────────────────

function HeroCountdown({
  days, hours, minutes, seconds, palette, showLabels, glowClass, level,
}: Breakdown & { palette: ColorPalette; showLabels: boolean; glowClass: string; level: UrgencyLevel }) {
  const units: [number, string][] = [
    [days, 'DÍAS'], [hours, 'HORAS'], [minutes, 'MIN'], [seconds, 'SEG'],
  ]

  return (
    <div
      className={`km-countdown-enter ${glowClass}`}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(16px, 3vw, 28px) clamp(14px, 3vw, 28px)',
        borderRadius: 'var(--radius-xl)',
        background: palette.gradient,
        boxShadow: `0 20px 60px -12px ${withAlpha(palette.base, 0.6)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        ['--km-glow' as string]: withAlpha(palette.base, 0.7),
      }}
    >
      <div className="km-countdown-shine" />
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 'clamp(2px, 1vw, 8px)', flexWrap: 'nowrap',
      }}>
        {units.map(([value, label], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className="km-time-block" style={{
                minWidth: 'clamp(52px, 12vw, 88px)', padding: 'clamp(8px, 1.5vw, 14px) 4px',
                textAlign: 'center', borderRadius: 'var(--radius-md)',
                background: 'rgba(0,0,0,0.32)',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 14px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(4px)',
              }}>
                <span
                  key={value}
                  className="km-countdown-digit"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 'clamp(1.7rem, 6vw, 3.4rem)',
                    fontWeight: 900, color: '#fff', lineHeight: 1,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)', letterSpacing: '-1px',
                  }}
                >
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              {showLabels && (
                <span style={{
                  fontSize: '10px', letterSpacing: '2px', color: 'rgba(255,255,255,0.85)',
                  fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}>
                  {label}
                </span>
              )}
            </div>
            {i < units.length - 1 && (
              <span className="km-countdown-colon" style={{
                fontSize: 'clamp(1.2rem, 3.5vw, 2.4rem)', fontWeight: 900, color: '#fff',
                margin: '0 clamp(1px, 0.6vw, 6px)', marginBottom: showLabels ? '24px' : '0',
                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>:</span>
            )}
          </div>
        ))}
      </div>

      {(level === 'critical' || level === 'urgent') && (
        <div style={{
          position: 'relative', marginTop: '16px', textAlign: 'center',
          fontSize: '12px', fontWeight: 800, letterSpacing: '1.5px',
          color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          animation: 'km-blink 1s ease-in-out infinite',
        }}>
          {level === 'urgent' ? '⚡ ÚLTIMA HORA ⚡' : '🔥 MENOS DE UN DÍA 🔥'}
        </div>
      )}
    </div>
  )
}

// ── CARD — píldora sólida con dígitos grandes, para tarjetas de metas ──────

function CardCountdown({ days, hours, minutes, seconds, palette, glowClass, level }: Breakdown & {
  palette: ColorPalette; glowClass: string; level: UrgencyLevel
}) {
  return (
    <div className={`km-countdown-enter ${glowClass}`} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '9px 14px', borderRadius: 'var(--radius-md)',
      background: palette.gradient,
      boxShadow: `0 6px 18px -4px ${withAlpha(palette.base, 0.55)}`,
      ['--km-glow' as string]: withAlpha(palette.base, 0.6),
    }}>
      <span style={{ fontSize: '15px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>⏱️</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', flex: 1, justifyContent: 'center' }}>
        {days > 0 && <Digit value={days} label="d" />}
        <Digit value={hours} label="h" />
        <Digit value={minutes} label="m" />
        <Digit value={seconds} label="s" tick />
      </div>
      {level === 'urgent' && (
        <span style={{
          fontSize: '10px', fontWeight: 900, color: '#fff', letterSpacing: '0.5px',
          textTransform: 'uppercase', animation: 'km-blink 0.8s ease-in-out infinite',
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }}>
          ¡urge!
        </span>
      )}
    </div>
  )
}

function Digit({ value, label, tick = false }: { value: number; label: string; tick?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', animation: tick ? 'km-tick 1s ease-in-out infinite' : 'none' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginRight: '3px' }}>
        {label}
      </span>
    </span>
  )
}

// ── DETAIL/DEFAULT — bloques medianos para el header del detalle ──────────

const DETAIL_FONT: Record<Size, string> = {
  xs: '1.1rem', sm: '1.4rem', md: '1.8rem', lg: '2.2rem', xl: '2.8rem',
}
const DETAIL_PAD: Record<Size, string> = {
  xs: '5px 6px', sm: '7px 8px', md: '10px 10px', lg: '12px 12px', xl: '14px 14px',
}
const DETAIL_MIN: Record<Size, string> = {
  xs: '36px', sm: '44px', md: '58px', lg: '68px', xl: '80px',
}

function DetailCountdown({ days, hours, minutes, seconds, palette, size, showLabels, glowClass }: Breakdown & {
  palette: ColorPalette; size: Size; showLabels: boolean; glowClass: string
}) {
  const units: [number, string][] = [
    [days, 'DÍAS'], [hours, 'HRS'], [minutes, 'MIN'], [seconds, 'SEG'],
  ]

  return (
    <div className={`km-countdown-enter ${glowClass}`} style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px',
      padding: '14px 18px', borderRadius: 'var(--radius-lg)',
      background: palette.gradient,
      boxShadow: `0 12px 30px -8px ${withAlpha(palette.base, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.2)`,
      ['--km-glow' as string]: withAlpha(palette.base, 0.65),
    }}>
      {units.map(([value, label], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{
              minWidth: DETAIL_MIN[size], padding: DETAIL_PAD[size], textAlign: 'center',
              borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: DETAIL_FONT[size], fontWeight: 900,
                color: '#fff', lineHeight: 1, textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}>
                {String(value).padStart(2, '0')}
              </span>
            </div>
            {showLabels && (
              <span style={{ fontSize: '9px', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>
                {label}
              </span>
            )}
          </div>
          {i < units.length - 1 && (
            <span style={{ fontSize: '1.2em', fontWeight: 900, color: 'rgba(255,255,255,0.6)', margin: '0 2px' }}>:</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── COMPACT — una línea, para espacios muy reducidos (previews) ────────────

function CompactCountdown({ days, hours, minutes, seconds, color }: Breakdown & { color: string }) {
  const parts = days > 0
    ? `${days}d ${String(hours).padStart(2, '0')}h`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '999px',
      background: withAlpha(color, 0.18), border: `1.5px solid ${withAlpha(color, 0.55)}`,
      color, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '11px',
    }}>
      ⏱ {parts}
    </span>
  )
}
