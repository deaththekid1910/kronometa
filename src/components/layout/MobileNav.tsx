'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useXPStore } from '@/store/xpStore'
import {
  LayoutDashboard, Target, Repeat2, BarChart2,
  Trophy, Settings, LogOut, Hexagon, X, Menu
} from 'lucide-react'

const links = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/goals',        icon: Target,          label: 'Metas' },
  { href: '/habits',       icon: Repeat2,         label: 'Hábitos' },
  { href: '/reports',      icon: BarChart2,       label: 'Reportes' },
  { href: '/achievements', icon: Trophy,          label: 'Logros' },
]

export default function MobileNav() {
  const [open, setOpen]  = useState(false)
  const pathname         = usePathname()
  const router           = useRouter()
  const { levelInfo }    = useXPStore()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* TOPBAR MÓVIL */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        height: '52px', background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Hexagon size={18} color="var(--cyan)" />
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            Krono<span style={{ color: 'var(--cyan)' }}>Meta</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '6px',
              background: 'linear-gradient(135deg,var(--purple),var(--cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, color: '#0A0E1A',
            }}>{levelInfo.level}</div>
            <span style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {levelInfo.xp} XP
            </span>
          </div>
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--text)',
              cursor: 'pointer', padding: '4px', display: 'flex',
            }}
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', zIndex: 48,
          }}
        />
      )}

      {/* DRAWER */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 49,
        width: '260px', background: 'var(--surface2)',
        borderRight: '1px solid var(--border)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        padding: '16px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '0 8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>
            Krono<span style={{ color: 'var(--cyan)' }}>Meta</span>
          </span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>NAVEGACIÓN</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
          {links.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 12px', borderRadius: 'var(--radius-sm)',
                color: active ? 'var(--cyan)' : 'var(--muted)',
                background: active ? '#00F5FF0D' : 'transparent',
                border: `1px solid ${active ? '#00F5FF22' : 'transparent'}`,
                fontSize: '14px', fontWeight: active ? 500 : 400,
                transition: 'all var(--transition)',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* XP BAR en drawer */}
        <div style={{
          background: 'var(--surface)', border: '1px solid #B026FF33',
          borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{levelInfo.title}</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
              Nv. {levelInfo.level}
            </span>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${levelInfo.progress}%`,
              background: 'linear-gradient(90deg,var(--purple),var(--cyan))',
              borderRadius: '4px',
            }} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
            {levelInfo.xpInLevel}/{levelInfo.xpForNext} XP
          </div>
        </div>

        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 12px', borderRadius: 'var(--radius-sm)',
          background: 'none', border: '1px solid var(--border)',
          color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', width: '100%',
        }}>
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  )
}