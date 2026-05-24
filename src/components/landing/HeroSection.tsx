'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

function AnimatedTimer() {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let secs = 5432
    const id = setInterval(() => {
      secs++
      const h = Math.floor(secs / 3600).toString().padStart(2,'0')
      const m = Math.floor((secs % 3600) / 60).toString().padStart(2,'0')
      const s = (secs % 60).toString().padStart(2,'0')
      if (ref.current) ref.current.textContent = `${h}:${m}:${s}`
    }, 1000)
    return () => clearInterval(id)
  }, [])
  return <span ref={ref} style={{ fontFamily: 'JetBrains Mono, monospace' }}>01:30:32</span>
}

function FloatingCard({ style, children }: { style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      position: 'absolute',
      background: 'rgba(19,24,41,0.9)',
      border: '1px solid #1F2937',
      borderRadius: '12px',
      padding: '12px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      ...style,
    }}>
      {children}
    </div>
  )
}

export default function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh',
      background: '#0A0E1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '80px clamp(16px,5vw,80px) 60px',
    }}>

      {/* GRID DE FONDO */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* GRADIENTES DE FONDO */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, #00F5FF08 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: '10%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, #B026FF08 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '40%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, #00FF8806 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <div style={{
        maxWidth: '1200px', width: '100%', margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
        gap: '60px', alignItems: 'center', position: 'relative', zIndex: 1,
      }} className="hero-grid">

        {/* IZQUIERDA — TEXTO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#00F5FF0D', border: '1px solid #00F5FF33',
            borderRadius: '20px', padding: '6px 14px', width: 'fit-content',
            animation: 'fadeUp 0.6s ease forwards',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00F5FF', animation: 'pulse-dot 1.5s infinite' }} />
            <span style={{ fontSize: '13px', color: '#00F5FF', fontWeight: 500 }}>Tu sistema de metas, reinventado</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 700, lineHeight: 1.1,
            margin: 0, letterSpacing: '-1.5px',
            color: '#F1F5F9',
            animation: 'fadeUp 0.6s 0.1s ease both',
          }}>
            Convierte tus metas en{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00F5FF, #B026FF)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              aventuras épicas
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 2vw, 17px)',
            color: '#94A3B8', lineHeight: 1.7, margin: 0,
            maxWidth: '480px',
            animation: 'fadeUp 0.6s 0.2s ease both',
          }}>
            Gestiona metas, hábitos y tiempo con cronómetros persistentes, un avatar que avanza según tu progreso real, y reportes animados que te muestran exactamente a qué le dedicas tu vida.
          </p>

          <div style={{
            display: 'flex', gap: '12px', flexWrap: 'wrap',
            animation: 'fadeUp 0.6s 0.3s ease both',
          }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '10px',
              background: '#00F5FF', color: '#0A0E1A',
              fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 30px #00F5FF44',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px #00F5FF66'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 30px #00F5FF44'
              }}
            >
              Empezar gratis <ArrowRight size={18} />
            </Link>

            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 24px', borderRadius: '10px',
              background: 'transparent', border: '1px solid #1F2937',
              color: '#94A3B8', fontSize: '15px', textDecoration: 'none',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#00F5FF33'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#F1F5F9'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1F2937'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'
              }}
            >
              <Play size={15} />
              Ya tengo cuenta
            </Link>
          </div>

          <div style={{
            display: 'flex', gap: '24px', flexWrap: 'wrap',
            animation: 'fadeUp 0.6s 0.4s ease both',
          }}>
            {[
              { val: '100%', label: 'Gratis para siempre' },
              { val: '∞',   label: 'Metas y hábitos' },
              { val: '24/7', label: 'Cronómetro activo' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#00F5FF', fontFamily: 'JetBrains Mono, monospace' }}>{s.val}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA — MOCKUP */}
        <div style={{ position: 'relative', height: '500px', animation: 'fadeUp 0.6s 0.2s ease both' }} className="hero-mockup">

          {/* CARD PRINCIPAL */}
          <div style={{
            position: 'absolute', top: '10%', left: '5%', right: '5%',
            background: 'rgba(19,24,41,0.95)',
            border: '1px solid #1F2937',
            borderRadius: '16px', padding: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00F5FF', boxShadow: '0 0 8px #00F5FF', animation: 'pulse-dot 1.5s infinite' }} />
              <span style={{ fontSize: '12px', color: '#94A3B8' }}>My Comercio We</span>
              <span style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: 700, color: '#FFB800', fontFamily: 'JetBrains Mono, monospace' }}>
                <AnimatedTimer />
              </span>
            </div>

            {/* BARRA PROGRESO */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Progreso</span>
                <span style={{ fontSize: '12px', color: '#00F5FF', fontFamily: 'JetBrains Mono, monospace' }}>62%</span>
              </div>
              <div style={{ height: '6px', background: '#1F2937', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: '62%',
                  background: 'linear-gradient(90deg, #00F5FF88, #00F5FF)',
                  borderRadius: '6px',
                  boxShadow: '0 0 10px #00F5FF66',
                  animation: 'progress-grow 1.5s 0.5s ease both',
                }} />
              </div>
            </div>

            {/* AVATAR TRACK */}
            <div style={{ position: 'relative', height: '32px', marginBottom: '14px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: '#1F2937', transform: 'translateY(-50%)', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: '62%', background: '#00F5FF44', borderRadius: '2px' }} />
              </div>
              {[0,14,28,42,57,71,85,100].map((pct, i) => (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: `${pct}%`,
                  transform: 'translate(-50%,-50%)',
                  width: i < 5 ? '10px' : '8px',
                  height: i < 5 ? '10px' : '8px',
                  borderRadius: '50%',
                  background: i < 5 ? '#00F5FF' : '#1F2937',
                  border: `1.5px solid ${i < 5 ? '#00F5FF' : '#374151'}`,
                  boxShadow: i < 5 ? '0 0 8px #00F5FF' : 'none',
                  zIndex: 1,
                }} />
              ))}
              <div style={{
                position: 'absolute', top: '50%', left: '62%',
                transform: 'translate(-50%,-50%)',
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#00F5FF', border: '2px solid #0A0E1A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: '#0A0E1A', fontWeight: 700,
                zIndex: 2, boxShadow: '0 0 12px #00F5FF',
              }}>★</div>
            </div>

            {/* SUBMETAS */}
            {[
              { title: 'Diseño UI', done: true },
              { title: 'Backend API', done: true },
              { title: 'Integrar pagos', done: false },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '8px',
                background: s.done ? '#00F5FF08' : 'transparent',
                marginBottom: '4px',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  background: s.done ? '#00F5FF' : 'transparent',
                  border: `2px solid ${s.done ? '#00F5FF' : '#374151'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: '#0A0E1A', fontWeight: 700,
                  boxShadow: s.done ? '0 0 8px #00F5FF66' : 'none',
                }}>
                  {s.done ? '✓' : ''}
                </div>
                <span style={{ fontSize: '12px', color: s.done ? '#64748B' : '#F1F5F9', textDecoration: s.done ? 'line-through' : 'none' }}>
                  {s.title}
                </span>
                {s.done && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#00F5FF', fontFamily: 'JetBrains Mono,monospace' }}>+50 XP</span>}
              </div>
            ))}
          </div>

          {/* CARDS FLOTANTES */}
          <FloatingCard style={{ top: '2%', right: '-2%', animation: 'float 3s ease-in-out infinite' }}>
            <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '3px' }}>XP TOTAL</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#B026FF', fontFamily: 'JetBrains Mono,monospace' }}>2,840</div>
            <div style={{ fontSize: '10px', color: '#B026FF' }}>Nivel 7 · Guerrero</div>
          </FloatingCard>

          <FloatingCard style={{ bottom: '18%', right: '-4%', animation: 'float 3s 1s ease-in-out infinite' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px' }}>🔥</span>
              <div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>RACHA</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFB800', fontFamily: 'JetBrains Mono,monospace' }}>14d</div>
              </div>
            </div>
          </FloatingCard>

          <FloatingCard style={{ bottom: '5%', left: '0%', animation: 'float 3s 0.5s ease-in-out infinite' }}>
            <div style={{ fontSize: '10px', color: '#00FF88', marginBottom: '3px' }}>🏆 LOGRO DESBLOQUEADO</div>
            <div style={{ fontSize: '12px', color: '#F1F5F9', fontWeight: 500 }}>Semana Perfecta</div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>+200 XP</div>
          </FloatingCard>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0px); }
          50%      { transform:translateY(-8px); }
        }
        @keyframes progress-grow {
          from { width:0; }
          to   { width:62%; }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-mockup { display:none; }
        }
      `}</style>
    </section>
  )
}