'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  ACHIEVEMENTS, getUserXP,
  checkAndUnlockAchievements
} from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import AchievementCard from '@/components/gamification/AchievementCard'
import Button from '@/components/ui/Button'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Panel, PageHeader, PageShell, TabBar } from '@/components/ui/Layout'
import { RefreshCw, Trophy, Lock, Star, LayoutGrid } from 'lucide-react'

type Filter = 'all' | 'unlocked' | 'locked'

export default function AchievementsPage() {
  const { levelInfo, setXP, setNewAchievements } = useXPStore()
  const [unlockedKeys,  setUnlockedKeys]  = useState<string[]>([])
  const [unlockedDates, setUnlockedDates] = useState<Record<string, string>>({})
  const [loading,   setLoading]   = useState(true)
  const [checking,  setChecking]  = useState(false)
  const [filter,    setFilter]    = useState<Filter>('all')
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [xp, { data: achs }] = await Promise.all([
      getUserXP(user.id),
      supabase.from('achievements').select('key, unlocked_at').eq('user_id', user.id),
    ])
    setXP(xp)
    setUnlockedKeys((achs || []).map(a => a.key))
    setUnlockedDates(Object.fromEntries((achs || []).map(a => [a.key, a.unlocked_at])))
    setLoading(false)
  }

  async function handleCheck() {
    setChecking(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setChecking(false); return }
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

  const unlockedList = ACHIEVEMENTS.filter(a => unlockedKeys.includes(a.key))
    .sort((x, y) => (unlockedDates[y.key] || '').localeCompare(unlockedDates[x.key] || ''))
  const lockedList   = ACHIEVEMENTS.filter(a => !unlockedKeys.includes(a.key))
  const pctAch       = total > 0 ? Math.round((unlocked / total) * 100) : 0
  const xpPending    = lockedList.reduce((a, x) => a + x.xp, 0)
  const grid: React.CSSProperties = {
    display: 'grid', gap: '10px',
    gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
  }

  return (
    <PageShell isMobile={isMobile}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes glow-pulse{0%,100%{box-shadow:0 0 20px #B026FF88}50%{box-shadow:0 0 40px #B026FFcc,0 0 80px #00F5FF44}}`}</style>

      <PageHeader
        icon={<Trophy size={18} />} color="#FFB800" title="Logros y Nivel"
        subtitle="Tu progreso en el sistema de gamificación" isMobile={isMobile}
        action={
          <Button variant="ghost" size="sm"
            icon={<RefreshCw size={13} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />}
            onClick={handleCheck}>
            Verificar logros
          </Button>
        }
      />

      {/* PANEL DE NIVEL — se reorganiza en móvil */}
      <section style={{
        background: 'var(--surface)', border: '1px solid #B026FF44',
        borderRadius: 'var(--radius-lg)', padding: isMobile ? '18px' : '24px',
        boxShadow: '0 0 40px #B026FF18', position: 'relative', overflow: 'hidden',
        display: 'grid', alignItems: 'center', gap: isMobile ? '16px' : '24px',
        gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'auto minmax(0, 1fr) auto',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle,#B026FF22,transparent)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
          <div style={{
            width: isMobile ? '60px' : '72px', height: isMobile ? '60px' : '72px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,var(--purple),var(--cyan))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '24px' : '28px', fontWeight: 700, color: '#0A0E1A',
            fontFamily: 'var(--font-mono)', boxShadow: '0 0 24px #B026FF66',
            animation: 'glow-pulse 2s infinite',
          }}>{level}</div>
          {isMobile && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Nivel {level}</div>
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 600 }}>{title}</span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Nivel {level}</span>
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>
            {xpInLevel} / {xpForNext} XP para el nivel {level + 1}
          </div>
          <div style={{ height: '8px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg,var(--purple),var(--cyan))',
              borderRadius: '8px', boxShadow: '0 0 10px #B026FF88',
              transition: 'width 1s ease',
            }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
          {[
            { icon: <Star size={14} />,   label: 'XP total',     value: levelInfo.xp,           color: 'var(--purple)' },
            { icon: <Trophy size={14} />, label: 'Logros',       value: `${unlocked}/${total}`, color: 'var(--amber)' },
            { icon: <Lock size={14} />,   label: 'XP por ganar', value: xpPending,              color: 'var(--cyan)' },
          ].map(st => (
            <div key={st.label} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '10px 12px', textAlign: 'center', minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: st.color, marginBottom: '4px' }}>
                {st.icon}
                <span style={{ fontSize: '10px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{st.label}</span>
              </div>
              <div style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: st.color }}>{st.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AVANCE DE LOGROS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
          <span>Colección de logros</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>{pctAch}%</span>
        </div>
        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pctAch}%`, background: 'linear-gradient(90deg,#FFB80088,#FFB800)', transition: 'width 1s ease' }} />
        </div>
      </div>

      <TabBar<Filter>
        isMobile={isMobile} active={filter} onChange={setFilter}
        tabs={[
          { id: 'all',      label: 'Todos',          icon: <LayoutGrid size={14} />, color: 'var(--purple)', count: total },
          { id: 'unlocked', label: 'Desbloqueados',  icon: <Trophy size={14} />,     color: 'var(--amber)',  count: unlocked },
          { id: 'locked',   label: 'Por desbloquear', icon: <Lock size={14} />,      color: 'var(--muted)',  count: total - unlocked },
        ]}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando logros...
        </div>
      ) : (
        <>
          {filter !== 'locked' && (
            <Panel icon={<Trophy size={14} />} title="Desbloqueados" color="var(--amber)" count={unlocked} isMobile={isMobile}
              subtitle={unlocked > 0 ? 'Los más recientes primero' : undefined}>
              {unlocked === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '1.5rem 1rem', margin: 0 }}>
                  Aún no tienes logros. Crea una meta o un hábito para conseguir el primero.
                </p>
              ) : (
                <div style={grid}>
                  {unlockedList.map(a => (
                    <AchievementCard key={a.key} achievement={a} unlocked={true} unlockedAt={unlockedDates[a.key]} />
                  ))}
                </div>
              )}
            </Panel>
          )}

          {filter !== 'unlocked' && lockedList.length > 0 && (
            <Panel icon={<Lock size={14} />} title="Por desbloquear" color="var(--muted)" count={lockedList.length} isMobile={isMobile}
              subtitle={`${xpPending} XP esperándote`}>
              <div style={grid}>
                {lockedList.map(a => (
                  <AchievementCard key={a.key} achievement={a} unlocked={false} />
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </PageShell>
  )
}
