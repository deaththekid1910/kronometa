'use client'

import { useEffect, useState } from 'react'
import { useXPStore } from '@/store/xpStore'
import { Achievement } from '@/lib/gamification'

export default function XPToast() {
  const { newAchievements, clearAchievements } = useXPStore()
  const [visible, setVisible] = useState<Achievement | null>(null)

  useEffect(() => {
    if (newAchievements.length > 0) {
      setVisible(newAchievements[0])
      const t = setTimeout(() => {
        setVisible(null)
        clearAchievements()
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [newAchievements])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 99,
      background: 'var(--surface)', border: `1px solid ${visible.color}66`,
      borderRadius: '14px', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: `0 0 30px ${visible.color}33`,
      animation: 'slideIn 0.3s ease',
      maxWidth: '300px',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
        background: visible.color + '22', border: `1px solid ${visible.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
      }}>
        {visible.icon}
      </div>

      <div>
        <div style={{ fontSize: '10px', color: visible.color, letterSpacing: '1px', fontWeight: 500, marginBottom: '2px' }}>
          LOGRO DESBLOQUEADO
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
          {visible.title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{visible.description}</div>
        {visible.xp > 0 && (
          <div style={{ fontSize: '11px', color: visible.color, fontFamily: 'var(--font-mono)', marginTop: '3px' }}>
            +{visible.xp} XP
          </div>
        )}
      </div>
    </div>
  )
}