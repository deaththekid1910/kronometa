'use client'

import { Achievement } from '@/lib/gamification'
import AchievementCard from '@/components/gamification/AchievementCard'
import { Trophy } from 'lucide-react'

export interface RecentAchievementItem { achievement: Achievement; unlockedAt: string }

interface Props { items: RecentAchievementItem[] }

export default function RecentAchievements({ items }: Props) {
  return (
    <div className="km-card-appear" style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Trophy size={14} color="var(--amber)" />
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
          LOGROS RECIENTES
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--dim)', fontSize: '13px' }}>
          Aún no desbloqueas logros. ¡Sigue avanzando!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(({ achievement, unlockedAt }) => (
            <AchievementCard key={achievement.key} achievement={achievement} unlocked unlockedAt={unlockedAt} />
          ))}
        </div>
      )}
    </div>
  )
}
