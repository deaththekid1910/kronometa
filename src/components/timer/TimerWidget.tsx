'use client'

import { useTimer } from '@/hooks/useTimer'
import { formatTime } from '@/lib/timer'
import { Play, Pause } from 'lucide-react'

interface Props {
  goalId: string
  color?: string
}

export default function TimerWidget({ goalId, color = 'var(--cyan)' }: Props) {
  const { isActive, currentSeconds, handleStart, handlePause } = useTimer(goalId)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 500,
        color: isActive ? 'var(--amber)' : 'var(--dim)',
        minWidth: '56px', transition: 'color var(--transition)',
      }}>
        {formatTime(currentSeconds)}
      </span>
      <button
        onClick={isActive ? handlePause : handleStart}
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: `1px solid ${isActive ? 'var(--amber)' : color}44`,
          background: isActive ? '#FFB80015' : color + '15',
          color: isActive ? 'var(--amber)' : color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--transition)', cursor: 'pointer',
          boxShadow: isActive ? 'var(--glow-amber)' : 'none',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
      >
        {isActive ? <Pause size={11} /> : <Play size={11} />}
      </button>
    </div>
  )
}