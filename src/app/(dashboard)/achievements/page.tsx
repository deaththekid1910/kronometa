'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  ACHIEVEMENTS, getUserAchievements, getUserXP,
  getLevelInfo, checkAndUnlockAchievements
} from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import AchievementCard from '@/components/gamification/AchievementCard'
import Button from '@/components/ui/Button'
import { Star, RefreshCw, Trophy, Zap, Lock } from 'lucide-react'

export default function AchievementsPage() {
  const { levelInfo, setXP, setNewAchievements } = useXPStore()
  const [unlockedKeys, setUnlockedKeys]           = useState<string[]>([])
  const [unlockedDates, setUnlockedDates]         = useState<Record<string,string>>({})
  const [loading, setLoading]                     = useState(true)
  const [checking, setChecking]                   = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [xp, { data: achs }] = await Promise.all([
      getUserXP(user.id),
      supabase.from('achievements').select('key, unlocked_at').eq('user_id', user.id),
    ])

    setXP(xp)
    const keys  = (achs || []).map(a => a.key)
    const dates = Object.fromEntries((achs || []).map(a => [a.key, a.unlocked_at]))
    setUnlockedKeys(keys)
    setUnlockedDates(dates)
    setLoading(false)
  }

  async function handleCheck() {
    setChecking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newOnes = await checkAndUnlockAchievements(user.id)
    if (newOnes.length > 0) {
      setNewAchievements(newOnes)
      await loadData()
    }
    setChecking(false)
  }

  const { level, title, xpInLevel, xpForNext, progress } = levelInfo
  const unlocked = unlockedKeys.length
  const total    = ACHIEVEMENTS.length

  return (
    <div style={{ padding: '24px 20px', maxWidth: '900px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px' }}>Logros y Nivel</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>Tu progreso en el sistema de gamificación</p>
        </div>
        <Button
          variant="ghost" size="sm"
          icon={<RefreshCw size={13} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />}
          onClick={handleCheck}
        >
          Verificar logros
        </Button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{
        background: 'var(--surface)', border: '1px solid #B026FF44',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '20px',
        boxShadow: '0 0 40px #B026FF18',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '140px', height: '140px', borderRadius: '50%',
          background: 'radial-gradient(circle, #B026FF22, transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 700, color: '#0A0E1A',
            fontFamily: 'var(--font-mono)', flexShrink: 0,
            boxShadow: '0 0 24px #B026FF66',
          }}>{level}</div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 600 }}>{title}</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Nivel {level}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
              {xpInLevel} / {xpForNext} XP para nivel {level + 1}
            </div>
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
                borderRadius: '8px',
                boxShadow: '0 0 10px #B026FF88',
                transition: 'width 1s ease',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: <Star size={14} />,   label: 'XP Total', value: levelInfo.xp,    color: 'var(--purple)' },
              { icon: <Trophy size={14} />, label: 'Logros',   value: `${unlocked}/${total}`, color: 'var(--amber)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: s.color, marginBottom: '2px', justifyContent: 'center' }}>
                  {s.icon}
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando logros...
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Trophy size={13} color="var(--amber)" />
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
              LOGROS DESBLOQUEADOS · {unlocked}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', marginBottom: '24px' }}>
            {ACHIEVEMENTS.filter(a => unlockedKeys.includes(a.key)).map(a => (
              <AchievementCard
                key={a.key}
                achievement={a}
                unlocked={true}
                unlockedAt={unlockedDates[a.key]}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Lock size={13} color="var(--dim)" />
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
              POR DESBLOQUEAR · {total - unlocked}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {ACHIEVEMENTS.filter(a => !unlockedKeys.includes(a.key)).map(a => (
              <AchievementCard key={a.key} achievement={a} unlocked={false} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}