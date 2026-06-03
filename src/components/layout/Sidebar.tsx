'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useXPStore } from '@/store/xpStore'
import { getUserXP } from '@/lib/gamification'
import { LayoutDashboard, Target, Repeat2, BarChart2, Trophy, Globe, BookOpen, Settings, LogOut, Hexagon, ListChecks } from 'lucide-react'

const navLinks = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/daily',        icon: ListChecks,      label: 'Diarias' },
  { href: '/goals',        icon: Target,          label: 'Metas' },
  { href: '/habits',       icon: Repeat2,         label: 'Hábitos' },
  { href: '/world',        icon: Globe,           label: 'Mundo' },
  { href: '/reports',      icon: BarChart2,       label: 'Reportes' },
  { href: '/achievements', icon: Trophy,          label: 'Logros' },
  { href: '/diary',        icon: BookOpen,        label: 'Diario' },
]

const GOAL_COLORS = ['#00F5FF', '#B026FF', '#00FF88', '#FFB800', '#FF3860']

interface Project {
  id: string
  title: string
  color: string
}

interface UserProfile {
  name: string
  email: string
  initials: string
}

export default function Sidebar() {
  const pathname              = usePathname()
  const router                = useRouter()
  const { levelInfo, setXP }  = useXPStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [profile,  setProfile]  = useState<UserProfile>({ name: '', email: '', initials: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name     = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
    const email    = user.email || ''
    const parts    = name.trim().split(' ')
    const initials = parts.length >= 2
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : name.slice(0, 2).toUpperCase()

    setProfile({ name, email, initials })

    const { data: goals } = await supabase
      .from('goals')
      .select('id, title, color, type')
      .eq('user_id', user.id)
      .eq('type', 'goal')
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(5)

    if (goals) {
      setProjects(goals.map(g => ({ id: g.id, title: g.title, color: g.color })))
    }

    const xp = await getUserXP(user.id)
    setXP(xp)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside style={{
      width: '220px', height: '100%',
      background: 'var(--surface2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px', flexShrink: 0,
    }}>
      {/* LOGO */}
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

      {/* NAV */}
      <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>
        NAVEGACIÓN
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
        {navLinks.map(({ href, icon: Icon, label }) => {
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

      {/* PROYECTOS DINÁMICOS */}
      {projects.length > 0 && (
        <>
          <div style={{ fontSize: '10px', color: 'var(--dim)', letterSpacing: '1.5px', padding: '0 8px', marginBottom: '6px' }}>
            PROYECTOS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '20px' }}>
            {projects.map(p => {
              const active = pathname === `/goals/${p.id}`
              return (
                <Link key={p.id} href={`/goals/${p.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                  color: active ? 'var(--text)' : 'var(--muted)',
                  background: active ? '#ffffff08' : 'transparent',
                  border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                  fontSize: '12px', cursor: 'pointer',
                  transition: 'all var(--transition)',
                  textDecoration: 'none',
                  overflow: 'hidden',
                }}>
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: p.color, flexShrink: 0,
                    boxShadow: `0 0 6px ${p.color}88`,
                  }} />
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.title}</span>
                </Link>
              )
            })}
          </div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* AJUSTES */}
      <Link href="/settings" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 10px', borderRadius: 'var(--radius-sm)',
        color: pathname === '/settings' ? 'var(--cyan)' : 'var(--muted)',
        fontSize: '13px', marginBottom: '8px',
        transition: 'all var(--transition)',
        background: pathname === '/settings' ? '#00F5FF0D' : 'transparent',
        border: `1px solid ${pathname === '/settings' ? '#00F5FF22' : 'transparent'}`,
      }}>
        <Settings size={16} />
        Ajustes
      </Link>

      {/* USUARIO DINÁMICO */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)', background: '#ffffff04',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#0A0E1A',
        }}>
          {profile.initials || '..'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: '12px', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {profile.name || '...'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
            Nv.{levelInfo.level} · {levelInfo.xp} XP
          </div>
        </div>
        <button onClick={handleLogout} style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          color: 'var(--dim)', padding: '4px', borderRadius: '6px',
          display: 'flex', cursor: 'pointer',
          transition: 'color var(--transition)',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'}
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}