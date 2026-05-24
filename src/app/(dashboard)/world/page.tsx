'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { GoalWithStats, SubGoal } from '@/types'
import { getTotalSeconds } from '@/lib/timer'
import WorldScene from '@/components/world/WorldScene'
import { Globe } from 'lucide-react'

export default function WorldPage() {
  const [goals,      setGoals]      = useState<GoalWithStats[]>([])
  const [totalSecs,  setTotalSecs]  = useState<Record<string, number>>({})
  const [loading,    setLoading]    = useState(true)
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'

  useEffect(() => { loadData() }, [])

  async function loadData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data } = await supabase
    .from('goals')
    .select('*, sub_goals(*), avatar_state(*)')
    .eq('user_id', user.id)
    .eq('type', 'goal')
    .eq('archived', false)
    .order('created_at', { ascending: false })

  if (data) {
    const goals = data.map(g => ({
      ...g,
      sub_goals:    (g.sub_goals || []).sort((a: SubGoal, b: SubGoal) => a.order_index - b.order_index),
      avatar_state: g.avatar_state?.[0],
    }))
    setGoals(goals)

    // Todas las queries de tiempo EN PARALELO
    const { data: allSessions } = await supabase
      .from('timer_sessions')
      .select('goal_id, elapsed_seconds, started_at, is_active')
      .in('goal_id', goals.map(g => g.id))

    const secsMap: Record<string, number> = {}
    for (const s of allSessions || []) {
      let secs = s.elapsed_seconds || 0
      if (s.is_active && s.started_at) {
        secs += Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000)
      }
      secsMap[s.goal_id] = (secsMap[s.goal_id] || 0) + secs
    }
    setTotalSecs(secsMap)
  }
  setLoading(false)
}
  return (
    <div style={{ padding: isMobile ? '12px' : '24px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '16px' : '24px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: '#B026FF0D', border: '1px solid #B026FF30',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Globe size={18} color="var(--purple)" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Mundo</h1>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
            Tu aventura visual de progreso
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '420px', color: 'var(--dim)',
          fontFamily: 'var(--font-mono)', fontSize: '13px',
        }}>
          cargando mundo...
        </div>
      ) : (
        <WorldScene goals={goals} totalSecondsByGoal={totalSecs} />
      )}
    </div>
  )
}