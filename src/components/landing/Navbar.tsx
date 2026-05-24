'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Hexagon, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '60px',
        background: scrolled ? 'rgba(10,14,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #1F293780' : '1px solid transparent',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(16px, 5vw, 80px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>

          {/* LOGO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: '#00F5FF12', border: '1px solid #00F5FF44',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Hexagon size={18} color="#00F5FF" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'Inter, sans-serif' }}>
              Krono<span style={{ color: '#00F5FF' }}>Meta</span>
            </span>
          </div>

          {/* LINKS DESKTOP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="nav-desktop">
            {['Características', 'Cómo funciona', 'Reportes'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} style={{
                fontSize: '14px', color: '#94A3B8', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#F1F5F9'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'}
              >{l}</a>
            ))}
          </div>

          {/* BOTONES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link href="/login" style={{
              padding: '8px 18px', borderRadius: '8px',
              background: 'transparent', border: '1px solid #1F2937',
              color: '#94A3B8', fontSize: '14px', textDecoration: 'none',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
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
            <Link href="/register" style={{
              padding: '8px 18px', borderRadius: '8px',
              background: '#00F5FF', border: 'none',
              color: '#0A0E1A', fontSize: '14px', fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 0 20px #00F5FF44',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#33F7FF'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 30px #00F5FF66'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#00F5FF'
                ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 20px #00F5FF44'
              }}
            >
              Empezar gratis
            </Link>

            {/* HAMBURGUESA MÓVIL */}
            <button
              onClick={() => setMobileOpen(p => !p)}
              style={{
                background: 'none', border: '1px solid #1F2937',
                borderRadius: '8px', padding: '6px', color: '#94A3B8',
                cursor: 'pointer', display: 'none',
              }}
              className="nav-mobile-btn"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* MENÚ MÓVIL */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99,
          background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1F2937',
          padding: '20px clamp(16px,5vw,80px)',
          display: 'flex', flexDirection: 'column', gap: '16px',
          animation: 'slideDown 0.2s ease',
        }}>
          {['Características', 'Cómo funciona', 'Reportes'].map(l => (
            <a key={l} href={`#${l}`} onClick={() => setMobileOpen(false)} style={{
              fontSize: '15px', color: '#94A3B8', textDecoration: 'none', padding: '8px 0',
              borderBottom: '1px solid #1F2937',
            }}>{l}</a>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px' }}>
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{
              padding: '12px', textAlign: 'center', borderRadius: '8px',
              border: '1px solid #1F2937', color: '#94A3B8',
              textDecoration: 'none', fontSize: '14px',
            }}>Iniciar sesión</Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} style={{
              padding: '12px', textAlign: 'center', borderRadius: '8px',
              background: '#00F5FF', color: '#0A0E1A',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            }}>Empezar gratis</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  )
}