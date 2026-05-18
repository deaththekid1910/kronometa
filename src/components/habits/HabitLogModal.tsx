'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { awardXP, checkAndUnlockAchievements } from '@/lib/gamification'
import { useXPStore } from '@/store/xpStore'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  goalId: string
  userId: string
  color: string
  onLogged: () => void
  onClose: () => void
}

export default function HabitLogModal({ goalId, userId, color, onLogged, onClose }: Props) {
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const { addXP, setNewAchievements } = useXPStore()

  async function handleLog() {
    setLoading(true)
    const supabase = createClient()
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const today    = new Date().toLocaleDateString('en-CA')

    const { data: existing } = await supabase
      .from('habit_logs')
      .select('id')
      .eq('goal_id', goalId)
      .eq('logged_date', today)
      .single()

    if (!existing) {
      await supabase.from('habit_logs').insert({
        goal_id: goalId, user_id: userId,
        logged_date: today, duration_seconds: 0,
        notes: notes.trim() || null, timezone,
      })

      const XP_PER_HABIT = 30
      await awardXP(userId, goalId, XP_PER_HABIT)
      addXP(XP_PER_HABIT)

      const newAchs = await checkAndUnlockAchievements(userId)
      if (newAchs.length > 0) setNewAchievements(newAchs)
    }

    onLogged()
    setLoading(false)
    onClose()
  }

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-xl)', padding: '24px',
      width: '100%', maxWidth: '380px',
      boxShadow: `0 0 40px ${color}18`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Registrar hábito</h2>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>NOTA (opcional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="¿Cómo fue hoy?" rows={3}
          style={{
            width: '100%', padding: '10px 14px',
            background: '#1a1a2e', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)',
            fontSize: '13px', outline: 'none', resize: 'none',
            fontFamily: 'var(--font-sans)', lineHeight: 1.5, boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = color}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px', padding: '8px', background: color + '12', borderRadius: 'var(--radius-sm)', border: `1px solid ${color}22` }}>
        <span style={{ fontSize: '12px', color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+30 XP</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>por completar hoy</span>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
        <Button variant="primary" size="md" loading={loading} onClick={handleLog}
          style={{ flex: 2, background: color, justifyContent: 'center' }}>
          Registrar
        </Button>
      </div>
    </div>
  )
}