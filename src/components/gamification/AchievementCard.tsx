'use client'

import { Achievement } from '@/lib/gamification'

interface Props {
  achievement: Achievement
  unlocked: boolean
  unlockedAt?: string
}

export default function AchievementCard({ achievement, unlocked, unlockedAt }: Props) {
  return (
    <div style={{
      background: unlocked ? 'var(--surface)' : '#0d0d18',
      border: `1px solid ${unlocked ? achievement.color + '44' : 'var(--border)'}`,
      borderRadius: 'var(--radius-md)', padding: '16px',
      transition: 'all var(--transition)',
      opacity: unlocked ? 1 : 0.45,
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => {
        if (!unlocked) return
        const el = e.currentTarget as HTMLDivElement
        el.style.transform   = 'translateY(-2px)'
        el.style.boxShadow   = `0 8px 24px ${achievement.color}22`
        el.style.borderColor = achievement.color + '66'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform   = 'translateY(0)'
        el.style.boxShadow   = 'none'
        el.style.borderColor = unlocked ? achievement.color + '44' : 'var(--border)'
      }}
    >
      {unlocked && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: `linear-gradient(90deg, transparent, ${achievement.color}, transparent)`,
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: unlocked ? achievement.color + '15' : '#ffffff05',
          border: `1px solid ${unlocked ? achievement.color + '33' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          filter: unlocked ? 'none' : 'grayscale(1)',
          boxShadow: unlocked ? `0 0 12px ${achievement.color}33` : 'none',
        }}>
          {achievement.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: unlocked ? 'var(--text)' : 'var(--dim)' }}>
              {achievement.title}
            </span>
            {achievement.xp > 0 && (
              <span style={{
                fontSize: '10px', fontFamily: 'var(--font-mono)',
                color: unlocked ? achievement.color : 'var(--dim)',
                background: unlocked ? achievement.color + '15' : 'transparent',
                padding: '2px 6px', borderRadius: '4px',
              }}>+{achievement.xp} XP</span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
            {achievement.description}
          </div>
          {unlocked && unlockedAt && (
            <div style={{ fontSize: '10px', color: achievement.color, marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              ✓ {new Date(unlockedAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {!unlocked && (
            <div style={{ fontSize: '10px', color: 'var(--dim)', marginTop: '4px' }}>🔒 Bloqueado</div>
          )}
        </div>
      </div>
    </div>
  )
}