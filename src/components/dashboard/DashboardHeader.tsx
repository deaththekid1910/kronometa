'use client'

import { useEffect, useState } from 'react'
import { getGreeting } from '@/lib/greeting'

interface Props { userName: string }

export default function DashboardHeader({ userName }: Props) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null   // evita mismatch de hidratación (hora depende del cliente)

  const greeting = getGreeting(now)
  const fecha = now.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hora  = now.toLocaleTimeString('es-VE', { hour12: false })

  return (
    <div style={{
      background: greeting.gradient, borderRadius: 'var(--radius-xl)',
      padding: 'clamp(16px, 3vw, 28px)', position: 'relative', overflow: 'hidden',
      boxShadow: `0 20px 50px -18px ${greeting.accent}66`,
      border: `1px solid ${greeting.accent}30`,
    }}
      className="km-countdown-enter"
    >
      <div className="km-shimmer-sweep" />
      <div style={{
        position: 'relative', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>{greeting.emoji}</span>
            <h1 style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', fontWeight: 800, color: '#fff', margin: 0,
              textShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}>
              {greeting.saludo}, {userName}
            </h1>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>
            📅 {fecha}
          </p>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.28)', padding: '10px 18px', borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
            letterSpacing: '0.1em', fontWeight: 700, marginBottom: '3px',
          }}>
            ⏰ Hora actual
          </div>
          <div style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            {hora}
          </div>
        </div>
      </div>
    </div>
  )
}
