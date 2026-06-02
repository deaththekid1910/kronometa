'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchNotifications } from '@/lib/notifications'
import { useNotificationStore } from '@/store/notificationStore'
import {
  playNotificationSound,
  playUrgentSound,
  playReminderSound,
} from '@/lib/notificationSound'

export default function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const { setNotifications }        = useNotificationStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
    checkAndNotify()
    const interval = setInterval(checkAndNotify, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  async function checkAndNotify() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: config } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (config && !config.enabled) return

    const daysBefore = config?.deadline_days_before || 3
    const notifs     = await fetchNotifications(user.id, daysBefore)
    setNotifications(notifs)

    if (notifs.length === 0) return

    const urgent = notifs.filter(n => n.type === 'overdue' || n.type === 'due_today')
    const soon   = notifs.filter(n => n.type === 'due_soon')

    // Reproduce sonido según urgencia
    if (urgent.length > 0) {
      playUrgentSound()
    } else if (soon.length > 0) {
      playReminderSound()
    } else {
      playNotificationSound()
    }

    // Notificaciones del navegador si tiene permiso
    if (Notification.permission !== 'granted') return

    for (const notif of notifs.slice(0, 3)) {
      try {
        const n = new Notification(`KronoMeta · ${notif.title}`, {
          body:    notif.message,
          icon:    '/icons/icon-192x192.png',
          badge:   '/icons/icon-72x72.png',
          tag:     notif.id,
          silent:  true, // el sonido lo manejamos nosotros
        })

        n.onclick = () => {
          window.focus()
          if (notif.goalId) window.location.href = `/goals/${notif.goalId}`
          n.close()
        }

        // Auto-cierra a los 8 segundos
        setTimeout(() => n.close(), 8000)
      } catch {}
    }
  }

  // Botón de activar notificaciones del sistema
  if (permission === 'granted') return null

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 998,
      background: '#131829',
      border: '1px solid #FFB80044',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px #FFB80022',
      maxWidth: '360px', width: 'calc(100% - 32px)',
      animation: 'pwa-slide-up 0.4s ease forwards',
    }}>
      <span style={{ fontSize: '22px', flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#F1F5F9', marginBottom: '2px' }}>
          Activar notificaciones
        </div>
        <div style={{ fontSize: '11px', color: '#64748B' }}>
          Recibe alertas de vencimientos y recordatorios
        </div>
      </div>
      <button
        onClick={requestPermission}
        style={{
          padding: '7px 14px', borderRadius: '8px',
          background: '#FFB800', border: 'none',
          color: '#0A0E1A', fontSize: '12px', fontWeight: 700,
          cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 0 12px #FFB80044',
        }}
      >
        Activar
      </button>
      <button
        onClick={() => setPermission('denied')}
        style={{
          background: 'none', border: 'none', color: '#374151',
          cursor: 'pointer', padding: '4px', fontSize: '16px', flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}