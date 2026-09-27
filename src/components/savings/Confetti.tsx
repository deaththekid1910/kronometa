'use client'

import { useMemo } from 'react'

const COLORS = ['#00F5FF', '#B026FF', '#00FF88', '#FFB800', '#FF3860', '#FFFFFF']

// Lluvia de confeti a pantalla completa (solo CSS, sin librerías).
// No bloquea clics: pointer-events none.
export default function Confetti({ pieces = 140, color }: { pieces?: number; color?: string }) {
  // Valores pseudoaleatorios estables para no recalcular en cada render
  const bits = useMemo(() => Array.from({ length: pieces }, (_, i) => {
    const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
    return {
      left:     r(1) * 100,
      delay:    r(2) * 1.2,
      duration: 2.4 + r(3) * 2,
      size:     6 + r(4) * 7,
      drift:    (r(5) - 0.5) * 220,
      spin:     360 + r(6) * 720,
      round:    r(7) > 0.6,
      color:    color && r(8) > 0.55 ? color : COLORS[Math.floor(r(9) * COLORS.length)],
    }
  }), [pieces, color])

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10002, overflow: 'hidden' }}>
      <style>{`
        @keyframes km-confetti {
          0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate3d(var(--drift), 105vh, 0) rotate(var(--spin)); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .km-confetti-bit { animation: none !important; display: none; } }
      `}</style>
      {bits.map((b, i) => (
        <span
          key={i}
          className="km-confetti-bit"
          style={{
            position: 'absolute', top: 0, left: `${b.left}%`,
            width: `${b.size}px`, height: `${b.round ? b.size : b.size * 0.45}px`,
            background: b.color, borderRadius: b.round ? '50%' : '2px',
            boxShadow: `0 0 6px ${b.color}88`,
            ['--drift' as string]: `${b.drift}px`,
            ['--spin' as string]: `${b.spin}deg`,
            animation: `km-confetti ${b.duration}s cubic-bezier(.2,.6,.4,1) ${b.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}
