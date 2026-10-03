'use client'

import { useRouter } from 'next/navigation'
import { Achievement } from '@/lib/gamification'
import { Panel, PanelAction } from '@/components/ui/Layout'
import { Trophy } from 'lucide-react'

export interface RecentAchievementItem { achievement: Achievement; unlockedAt: string }

interface Props { items: RecentAchievementItem[]; isMobile?: boolean }

// Lista compacta de los últimos logros (la tarjeta completa vive en Logros)
export default function RecentAchievements({ items, isMobile = false }: Props) {
  const router = useRouter()
  return (
    <Panel
      icon={<Trophy size={14} />} title="Logros recientes" color="var(--amber)" isMobile={isMobile}
      action={<PanelAction color="#FFB800" onClick={() => router.push('/achievements')}>Ver todos</PanelAction>}
    >
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.25rem 1rem', color: 'var(--muted)', fontSize: '13px' }}>
          Aún no desbloqueas logros. ¡Sigue avanzando!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {items.map(({ achievement: a, unlockedAt }) => (
            <div key={a.key} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface2)', border: `1px solid ${a.color}33`,
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, fontSize: '18px',
                background: `${a.color}15`, border: `1px solid ${a.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{a.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{a.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {new Date(unlockedAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              {a.xp > 0 && (
                <span style={{
                  fontSize: '11px', fontFamily: 'var(--font-mono)', color: a.color, flexShrink: 0,
                  background: `${a.color}15`, padding: '3px 8px', borderRadius: '6px',
                }}>+{a.xp} XP</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
