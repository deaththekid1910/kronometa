'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Target, Repeat2, BarChart2, Trophy } from 'lucide-react'

const links = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Inicio' },
  { href: '/goals',        icon: Target,          label: 'Metas' },
  { href: '/habits',       icon: Repeat2,         label: 'Hábitos' },
  { href: '/reports',      icon: BarChart2,       label: 'Reportes' },
  { href: '/achievements', icon: Trophy,          label: 'Logros' },
]

export default function MobileBottomBar() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      height: '60px', background: 'var(--surface2)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 4px',
    }}>
      {links.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '3px', padding: '6px 4px',
            color: active ? 'var(--cyan)' : 'var(--dim)',
            textDecoration: 'none', transition: 'color var(--transition)',
            borderRadius: 'var(--radius-sm)',
            background: active ? '#00F5FF08' : 'transparent',
          }}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span style={{ fontSize: '10px', fontWeight: active ? 500 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}