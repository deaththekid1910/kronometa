'use client'

interface Props {
  logs: { logged_date: string }[]
  color: string
}

export default function HabitStreak({ logs, color }: Props) {
  const logDates = new Set(logs.map(l => l.logged_date))

  const days: { date: Date; label: string; key: string; done: boolean }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({
      date: d,
      label: d.toLocaleDateString('es-VE', { weekday: 'short' }).slice(0, 2),
      key,
      done: logDates.has(key),
    })
  }

  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  for (let i = 0; i <= 365; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    if (logDates.has(key)) {
      streak++
    } else if (key !== today) {
      break
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px' }}>ÚLTIMAS 2 SEMANAS</span>
        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
          🔥 {streak} días de racha
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '4px' }}>
        {days.map(day => (
          <div key={day.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '100%', aspectRatio: '1',
              borderRadius: '5px',
              background: day.done ? color : 'var(--border)',
              boxShadow: day.done ? `0 0 6px ${color}66` : 'none',
              transition: 'all 0.3s',
              minWidth: '16px',
            }} />
            <span style={{ fontSize: '9px', color: 'var(--dim)' }}>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}