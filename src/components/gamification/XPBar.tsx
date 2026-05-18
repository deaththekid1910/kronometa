'use client'

import { useEffect } from 'react'
import { useXPStore } from '@/store/xpStore'
import { getUserXP, getLevelInfo } from '@/lib/gamification'
import { createClient } from '@/lib/supabase'

export default function XPBar() {
  const { levelInfo, setXP } = useXPStore()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const xp = await getUserXP(user.id)
      setXP(xp)
    }
    load()
  }, [])

  const { level, title, xpInLevel, xpForNext, progress } = levelInfo

  return (
    <div style={{
      background: 'var(--surface2)', borderTop: '1px solid var(--border)',
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, color: '#0A0E1A',
          }}>{level}</div>
          <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text)' }}>{title}</span>
        </div>
        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          {xpInLevel}/{xpForNext} XP
        </span>
      </div>
      <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
          borderRadius: '4px',
          boxShadow: '0 0 8px #B026FF66',
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}