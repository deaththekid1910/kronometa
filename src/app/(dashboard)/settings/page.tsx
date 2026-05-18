'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import ProfileSection  from '@/components/settings/ProfileSection'
import SecuritySection from '@/components/settings/SecuritySection'
import TimezoneSection from '@/components/settings/TimezoneSection'
import DangerSection   from '@/components/settings/DangerSection'
import { Settings } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
}

export default function SettingsPage() {
  const [user,    setUser]    = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  useEffect(() => { loadUser() }, [])

  async function loadUser() {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    setUser({
      id:    u.id,
      name:  u.user_metadata?.full_name || u.email?.split('@')[0] || '',
      email: u.email || '',
    })
    setLoading(false)
  }

  const gridCols = isMobile ? '1fr' : '1fr 1fr'

  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px', maxWidth: '900px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '16px' : '24px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: '#00F5FF0D', border: '1px solid #00F5FF30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Settings size={18} color="var(--cyan)" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Ajustes</h1>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
            Personaliza tu experiencia en KronoMeta
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : user ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* FILA 1 — Perfil + Seguridad */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '16px' }}>
            <ProfileSection
              name={user.name}
              email={user.email}
              onUpdate={name => setUser(prev => prev ? { ...prev, name } : prev)}
            />
            <SecuritySection />
          </div>

          {/* FILA 2 — Zona horaria */}
          <TimezoneSection userId={user.id} />

          {/* FILA 3 — Zona de peligro */}
          <DangerSection />

        </div>
      ) : null}
    </div>
  )
}