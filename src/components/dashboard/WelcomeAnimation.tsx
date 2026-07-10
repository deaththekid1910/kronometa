'use client'

import { useEffect, useState } from 'react'
import { getGreeting } from '@/lib/greeting'

interface Props {
  userName: string
  onComplete: () => void
}

interface Particle { id: number; icon: string; left: number; delay: number; duration: number; size: number }

export default function WelcomeAnimation({ userName, onComplete }: Props) {
  const [greeting] = useState(() => getGreeting())
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      icon: greeting.particles[i % greeting.particles.length],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 8,
      size: 16 + Math.random() * 26,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  )
  const [typed,       setTyped]       = useState('')
  const [showFrase,   setShowFrase]   = useState(false)
  const [showButton,  setShowButton]  = useState(false)
  const [closing,     setClosing]     = useState(false)

  const fullText = `${greeting.saludo}, ${userName}`

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i++
      setTyped(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(id)
        setTimeout(() => setShowFrase(true), 250)
        setTimeout(() => setShowButton(true), 900)
      }
    }, 55)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(handleClose, 5000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setClosing(true)
    setTimeout(onComplete, 500)
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: greeting.gradient,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', cursor: 'pointer',
        opacity: closing ? 0 : 1, transition: 'opacity 500ms ease',
      }}
    >
      <style>{`
        @keyframes km-welcome-blink { 50% { opacity: 0; } }
      `}</style>

      {/* PARTÍCULAS */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles.map(p => (
          <span key={p.id} style={{
            position: 'absolute', left: `${p.left}%`, bottom: '-60px',
            fontSize: `${p.size}px`,
            animation: `km-welcome-float ${p.duration}s ${p.delay}s linear infinite`,
          }}>
            {p.icon}
          </span>
        ))}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem', maxWidth: '900px', cursor: 'default' }}
      >
        <div
          className="km-countdown-expired"
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 6rem)', marginBottom: '1rem',
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))',
          }}
        >
          {greeting.emoji}
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 4.5rem)', fontWeight: 900, color: '#fff',
          marginBottom: '1.25rem', textShadow: '0 4px 20px rgba(0,0,0,0.4)',
          letterSpacing: '-0.02em', lineHeight: 1.1, minHeight: '1.2em',
        }}>
          {typed}
          <span style={{
            display: 'inline-block', width: '0.06em', height: '0.85em',
            background: '#fff', marginLeft: '0.12em',
            animation: 'km-welcome-blink 0.9s step-end infinite', verticalAlign: 'middle',
          }} />
        </h1>

        {showFrase && (
          <p className="animate-in" style={{
            fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: 'rgba(255,255,255,0.9)',
            maxWidth: '560px', margin: '0 auto 2.25rem', lineHeight: 1.5, fontWeight: 500,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}>
            {greeting.frase}
          </p>
        )}

        {showButton && (
          <button
            onClick={handleClose}
            className="animate-in"
            style={{
              padding: '0.9rem 2.6rem', fontSize: '1rem', fontWeight: 700,
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '999px', color: '#fff', cursor: 'pointer',
              backdropFilter: 'blur(8px)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              transition: 'all 250ms ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
          >
            Comenzar ✨
          </button>
        )}
      </div>

      {/* BARRA DE AUTO-DISMISS */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: '3px',
        background: 'rgba(255,255,255,0.55)',
        animation: 'km-welcome-progress 5s linear forwards',
      }} />
    </div>
  )
}
