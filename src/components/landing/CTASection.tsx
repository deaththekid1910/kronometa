'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section style={{
      padding: 'clamp(60px,10vw,120px) clamp(16px,5vw,80px)',
      background: '#0A0E1A', position: 'relative', overflow: 'hidden',
    }}>
      {/* GLOW */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '600px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, #00F5FF0A 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: '700px', margin: '0 auto',
        textAlign: 'center', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#00FF880D', border: '1px solid #00FF8833',
          borderRadius: '20px', padding: '6px 14px', marginBottom: '24px',
        }}>
          <span style={{ fontSize: '13px', color: '#00FF88', fontWeight: 500 }}>
            100% gratis · Sin tarjeta de crédito
          </span>
        </div>

        <h2 style={{
          fontSize: 'clamp(28px,5vw,48px)', fontWeight: 700,
          color: '#F1F5F9', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15,
        }}>
          Empieza tu primera meta{' '}
          <span style={{ background: 'linear-gradient(135deg,#00F5FF,#B026FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            hoy mismo
          </span>
        </h2>

        <p style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.7, marginBottom: '36px' }}>
          Únete y comienza a trackear tu tiempo, crear metas con submetas y ver tu avatar avanzar en el mapa.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '16px 32px', borderRadius: '10px',
            background: '#00F5FF', color: '#0A0E1A',
            fontSize: '16px', fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 0 40px #00F5FF44',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 60px #00F5FF66'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px #00F5FF44'
            }}
          >
            Crear cuenta gratis <ArrowRight size={18} />
          </Link>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '16px 24px', borderRadius: '10px',
            background: 'transparent', border: '1px solid #1F2937',
            color: '#94A3B8', fontSize: '16px', textDecoration: 'none',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#00F5FF44'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#F1F5F9'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1F2937'
              ;(e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'
            }}
          >
            Iniciar sesión
          </Link>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: '60px', paddingTop: '32px', borderTop: '1px solid #1F2937' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Krono<span style={{ color: '#00F5FF' }}>Meta</span>
          </div>
          <div style={{ fontSize: '13px', color: '#374151' }}>
            © 2025 KronoMeta · Hecho con ⚡ para personas que se toman en serio sus metas
          </div>
        </div>
      </div>
    </section>
  )
}