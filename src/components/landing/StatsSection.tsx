'use client'

import { useEffect, useRef, useState } from 'react'

function CountUp({ to, suffix = '', duration = 1500 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal]   = useState(0)
  const ref             = useRef<HTMLDivElement>(null)
  const started         = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const start  = Date.now()
        const tick   = () => {
          const elapsed = Date.now() - start
          const pct     = Math.min(elapsed / duration, 1)
          const eased   = 1 - Math.pow(1 - pct, 3)
          setVal(Math.round(to * eased))
          if (pct < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, duration])

  return <div ref={ref}>{val.toLocaleString()}{suffix}</div>
}

const stats = [
  { to: 10000, suffix: '+', label: 'Horas trackeadas', color: '#00F5FF' },
  { to: 500,   suffix: '+', label: 'Metas creadas',    color: '#B026FF' },
  { to: 98,    suffix: '%', label: 'Tasa de retención', color: '#00FF88' },
  { to: 21,    suffix: 'd', label: 'Racha máxima',      color: '#FFB800' },
]

export default function StatsSection() {
  return (
    <section style={{
      padding: 'clamp(40px,8vw,80px) clamp(16px,5vw,80px)',
      background: 'linear-gradient(180deg, #0A0E1A 0%, #0d1428 100%)',
      borderTop: '1px solid #1F2937', borderBottom: '1px solid #1F2937',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '32px', textAlign: 'center',
      }}>
        {stats.map(s => (
          <div key={s.label}>
            <div style={{
              fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
              color: s.color, marginBottom: '8px',
              textShadow: `0 0 20px ${s.color}66`,
            }}>
              <CountUp to={s.to} suffix={s.suffix} />
            </div>
            <div style={{ fontSize: '14px', color: '#64748B' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}