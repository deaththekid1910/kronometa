'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Target, Repeat2, BarChart2,
  Settings, LogOut, Hexagon, Trophy
} from 'lucide-react'

const links = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/goals',        icon: Target,          label: 'Metas' },
  { href: '/habits',       icon: Repeat2,         label: 'Hábitos' },
  { href: '/reports',      icon: BarChart2,       label: 'Reportes' },
  { href: '/achievements', icon: Trophy,          label: 'Logros' },
]

const projects = [
  { label: 'My Comercio We', color: 'var(--cyan)' },
  { label: 'My System',      color: 'var(--purple)' },
  { label: 'KronoMeta App',  color: 'var(--green)' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: '220px', minHeight: '100vh',
      background: 'var(--surface2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px', flexShrink: 0,
    }}>
      <div style={{ padding: '0 8px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '9px',
          background: '#00F5FF0D', border: '1px solid #00F5FF30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Hexagon size={16} color="var(--cyan)" />
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.3px' }}>
          Krono<span style={{ color: 'var(--cyan)' }}>Meta</span>
        </span>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>NAVEGACIÓN</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: 'var(--radius-sm)',
              color: active ? 'var(--cyan)' : 'var(--muted)',
              background: active ? '#00F5FF0D' : 'transparent',
              border: `1px solid ${active ? '#00F5FF22' : 'transparent'}`,
              fontSize: '13px', fontWeight: active ? 500 : 400,
              transition: 'all var(--transition)',
            }}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>PROYECTOS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
        {projects.map(p => (
          <div key={p.label} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: 'var(--radius-sm)',
            color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            transition: 'all var(--transition)',
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <Link href="/settings" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 10px', borderRadius: 'var(--radius-sm)',
        color: 'var(--muted)', fontSize: '13px', marginBottom: '8px',
        transition: 'all var(--transition)',
      }}>
        <Settings size={16} />
        Ajustes
      </Link>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)', background: '#ffffff04',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#0A0E1A', flexShrink: 0,
        }}>K</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500 }}>Kirito</div>
          <div style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>Nivel 7 · 2,840 XP</div>
        </div>
        <button onClick={handleLogout} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: 'var(--dim)', padding: '4px', borderRadius: '6px',
          display: 'flex', transition: 'color var(--transition)',
        }}>
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}