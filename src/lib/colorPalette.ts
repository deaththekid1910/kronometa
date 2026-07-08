// Utilidades de color puras (sin dependencias externas) para derivar la
// paleta de un color base: versiones clara/oscura, glow y mezclas de
// urgencia (ámbar/rojo) usadas por el countdown de metas.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full  = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num   = parseInt(full, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// Mezcla dos colores hex; ratio 0 = solo `a`, 1 = solo `b`.
export function mix(a: string, b: string, ratio: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const t = Math.max(0, Math.min(1, ratio))
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t)
}

export function lighten(hex: string, amount = 0.7): string {
  return mix(hex, '#ffffff', amount)
}

export function darken(hex: string, amount = 0.4): string {
  return mix(hex, '#000000', amount)
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface ColorPalette {
  base: string
  light: string
  dark: string
  glow: string
  gradient: string
  urgencyMix: { warning: string; critical: string; expired: string }
}

const WARNING  = '#F59E0B'
const CRITICAL = '#EF4444'
const EXPIRED  = '#7F1D1D'

export function getColorPalette(baseColor: string): ColorPalette {
  return {
    base:     baseColor,
    light:    lighten(baseColor, 0.8),
    dark:     darken(baseColor, 0.35),
    glow:     withAlpha(baseColor, 0.5),
    gradient: `linear-gradient(135deg, ${baseColor} 0%, ${darken(baseColor, 0.35)} 100%)`,
    urgencyMix: {
      warning:  mix(baseColor, WARNING, 0.55),
      critical: mix(baseColor, CRITICAL, 0.65),
      expired:  EXPIRED,
    },
  }
}

export type UrgencyLevel = 'normal' | 'warning' | 'critical' | 'urgent' | 'expired'

// Determina el nivel de urgencia según el % de tiempo restante y el tiempo absoluto.
export function getUrgencyLevel(msRemaining: number, pctRemaining: number | null): UrgencyLevel {
  if (msRemaining <= 0) return 'expired'
  if (msRemaining <= 60 * 60 * 1000) return 'urgent'      // ≤ 1 hora
  if (pctRemaining !== null) {
    if (pctRemaining <= 0.10) return 'critical'
    if (pctRemaining <= 0.30) return 'warning'
  }
  return 'normal'
}

export function urgencyColor(palette: ColorPalette, level: UrgencyLevel): string {
  switch (level) {
    case 'expired':  return palette.urgencyMix.expired
    case 'urgent':   return CRITICAL
    case 'critical': return palette.urgencyMix.critical
    case 'warning':  return palette.urgencyMix.warning
    default:         return palette.base
  }
}
