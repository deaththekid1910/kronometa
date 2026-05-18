'use client'

import { useTimerStore } from '@/store/timerStore'
import { formatTime } from '@/lib/timer'
import { Plus } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotificationBell from '@/components/notifications/NotificationBell'

interface Props {
  onNewGoal?: () => void
}

export default function TopBar({ onNewGoal }: Props) {
  const { activeSession, currentSeconds } = useTimerStore()

  const now     = new Date()
  const dateStr = now.toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <header style={{
      height: '54px', background: 'var(--surface2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px', flexShrink: 0, gap: '12px',
    }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 500 }}>Dashboard</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'capitalize' }}>{dateStr}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeSession?.is_active && (
          <Badge color="amber" dot pulse>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {formatTime(currentSeconds)}
            </span>
            <span style={{ color: 'var(--dim)', fontSize: '11px' }}>corriendo</span>
          </Badge>
        )}

        <NotificationBell />

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onNewGoal}
        >
          Nueva meta
        </Button>
      </div>
    </header>
  )
}