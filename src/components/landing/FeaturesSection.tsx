'use client'

import { useEffect, useRef, useState } from 'react'
import { Clock, Target, Repeat2, BarChart2, Globe, Zap } from 'lucide-react'

const features = [
  {
    icon: Clock, color: '#FFB800', glow: '#FFB80033',
    title: 'Cronómetro persistente',
    desc: 'Activa el cronómetro en una meta y cierra la app. El tiempo sigue corriendo en el servidor. Al volver, ves exactamente cuánto llevas.',
  },
  {
    icon: Target, color: '#00F5FF', glow: '#00F5FF33',
    title: 'Avatar que avanza',
    desc: 'Tu personaje se mueve por el mapa según las submetas que completas. Ve visualmente dónde estás y cuánto te falta para conquistar tu meta.',
  },
  {
    icon: Repeat2, color: '#00FF88', glow: '#00FF8833',
    title: 'Hábitos con racha',
    desc: 'Registra hábitos diarios, lleva tu racha y ve la grilla de consistencia de los últimos 30 días. Sin fechas límite, solo consistencia.',
  },
  {
    icon: BarChart2, color: '#B026FF', glow: '#B026FF33',
    title: 'Reportes animados',
    desc: 'Gráficas de torta, radar, velas y área animadas que te muestran cómo distribuyes tu tiempo entre metas y hábitos.',
  },
  {
    icon: Zap, color: '#FF3860', glow: '#FF386033',
    title: 'Gamificación real',
    desc: 'Gana XP al completar submetas y hábitos. Sube de nivel, desbloquea logros y ve tu progreso en un sistema de gamificación completo.',
  },
  {
    icon: Globe, color: '#00F5FF', glow: '#00F5FF33',
    title: 'Zona horaria automática',
    desc: 'Detecta tu ubicación automáticamente. En Venezuela, Colombia o España — todas las fechas y tiempos se ajustan a tu zona horaria.',
  },
]

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const Icon = feature.icon

  return (
    <div ref={ref} style={{
      background: '#131829',
      border: '1px solid #1F2937',
      borderRadius: '16px', padding: '24px',
      transition: 'all 0.4s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transitionDelay: `${index * 0.08}s`,
      cursor: 'default',
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = feature.color + '44'
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = `0 12px 40px ${feature.glow}`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = '#1F2937'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: feature.glow, border: `1px solid ${feature.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <Icon size={22} color={feature.color} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px', color: '#F1F5F9', letterSpacing: '-0.3px' }}>
        {feature.title}
      </h3>
      <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.7, margin: 0 }}>
        {feature.desc}
      </p>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="Características" style={{
      padding: 'clamp(60px,10vw,120px) clamp(16px,5vw,80px)',
      background: '#0A0E1A', position: 'relative',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#B026FF0D', border: '1px solid #B026FF33',
            borderRadius: '20px', padding: '6px 14px', marginBottom: '16px',
          }}>
            <span style={{ fontSize: '13px', color: '#B026FF', fontWeight: 500 }}>¿Qué hace KronoMeta?</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700,
            color: '#F1F5F9', margin: '0 0 16px', letterSpacing: '-1px',
          }}>
            Todo lo que necesitas para{' '}
            <span style={{ background: 'linear-gradient(135deg,#00F5FF,#B026FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              no rendirte
            </span>
          </h2>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Una plataforma que combina gestión de proyectos, tracking de hábitos y gamificación en una sola experiencia.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  )
}