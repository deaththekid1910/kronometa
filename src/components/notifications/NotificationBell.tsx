'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { fetchNotifications } from '@/lib/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import NotificationPanel from './NotificationPanel'

export default function NotificationBell() {
  const [open,   setOpen]   = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref                 = useRef<HTMLDivElement>(null)
  const { unreadCount, setNotifications } = useNotificationStore()

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: config } = await supabase
      .from('notification_settings')
      .select('enabled, deadline_alerts, deadline_days_before')
      .eq('user_id', user.id)
      .single()

    if (config && !config.enabled) {
      setNotifications([])
      setLoaded(true)
      return
    }

    const daysBefore = config?.deadline_days_before || 3
    const notifs     = await fetchNotifications(user.id, daysBefore)
    setNotifications(notifs)
    setLoaded(true)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          background: open ? '#00F5FF0D' : 'transparent',
          border: `1px solid ${open ? '#00F5FF33' : 'var(--border)'}`,
          color: open ? 'var(--cyan)' : 'var(--muted)',
          transition: 'all var(--transition)',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = '#ffffff08'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
          }
        }}
      >
        <Bell size={17} />
        {loaded && unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: 'var(--red)', color: '#fff',
            fontSize: '9px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
            fontFamily: 'var(--font-mono)',
            animation: 'pulse-dot 2s infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  )
}