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

// Clave en localStorage para rastrear cuándo se notificó
const NOTIF_KEY = 'km_last_notif'

interface NotifRecord {
  date: string        // YYYY-MM-DD
  times: string[]     // ['09:00', '18:00'] ya notificadas hoy
}

function getRecord(): NotifRecord {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (!raw) return { date: '', times: [] }
    return JSON.parse(raw)
  } catch {
    return { date: '', times: [] }
  }
}

function markNotified(time: string) {
  const today  = new Date().toISOString().split('T')[0]
  const record = getRecord()
  if (record.date !== today) {
    // Nuevo día — reinicia
    localStorage.setItem(NOTIF_KEY, JSON.stringify({ date: today, times: [time] }))
  } else {
    if (!record.times.includes(time)) {
      record.times.push(time)
      localStorage.setItem(NOTIF_KEY, JSON.stringify(record))
    }
  }
}

function alreadyNotifiedToday(time: string): boolean {
  const today  = new Date().toISOString().split('T')[0]
  const record = getRecord()
  if (record.date !== today) return false
  return record.times.includes(time)
}

// Verifica si ahora mismo coincide con una hora programada (±2 min de margen)
function matchesScheduledTime(scheduledTime: string): boolean {
  const now     = new Date()
  const [h, m]  = scheduledTime.split(':').map(Number)
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const schMins = h * 60 + m
  return Math.abs(nowMins - schMins) <= 2
}

export default function PushNotificationSetup() {
  const [permission,    setPermission]    = useState<NotificationPermission>('default')
  const [showBanner,    setShowBanner]    = useState(false)
  const { setNotifications } = useNotificationStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window) {
      setPermission(Notification.permission)
      if (Notification.permission === 'default') {
        // Muestra el banner después de 5 segundos
        setTimeout(() => setShowBanner(true), 5000)
      }
    }

    // Verifica cada minuto si es hora de notificar
    const interval = setInterval(checkSchedule, 60 * 1000)
    checkSchedule() // verifica inmediatamente al cargar
    return () => clearInterval(interval)
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    setShowBanner(false)
  }

  async function checkSchedule() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: config } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!config || !config.enabled || !config.daily_reminder) return

  // Lee múltiples horarios
  let times: { id: string; time: string }[] = []
  try {
    const raw = config.daily_reminder_time
    if (raw && raw.startsWith('[')) {
      times = JSON.parse(raw)
    } else if (raw) {
      times = [{ id: '1', time: raw.slice(0, 5) }]
    }
  } catch {
    times = [{ id: '1', time: '09:00' }]
  }

  // Verifica cada horario configurado
  for (const t of times) {
    const scheduledTime = t.time.slice(0, 5)
    if (matchesScheduledTime(scheduledTime) && !alreadyNotifiedToday(scheduledTime)) {
      await runNotification(user.id, config, scheduledTime)
      break // Solo una notificación por ciclo de verificación
    }
  }

  // Verifica también horarios de tareas recurrentes individuales
  const { data: recurringTasks } = await supabase
    .from('recurring_tasks')
    .select('id, title, notification_times, goal_id')
    .eq('user_id', user.id)
    .eq('archived', false)
    .gte('deadline', new Date().toISOString().split('T')[0])

  for (const rt of recurringTasks || []) {
    const rtTimes: string[] = Array.isArray(rt.notification_times)
      ? rt.notification_times
      : ['09:00']

    for (const t of rtTimes) {
      const tKey = `rt_${rt.id}_${t}`
      if (matchesScheduledTime(t) && !alreadyNotifiedToday(tKey)) {
        markNotified(tKey)
        playReminderSound()

        if (Notification.permission === 'granted') {
          try {
            const n = new Notification(`KronoMeta · 🔄 Tarea recurrente`, {
              body:   `"${rt.title}" · pendiente de hoy`,
              icon:   '/icons/icon-192x192.png',
              badge:  '/icons/icon-72x72.png',
              tag:    `rt-${rt.id}-${t}`,
              silent: true,
            })
            n.onclick = () => { window.focus(); window.location.href = `/goals/${rt.goal_id}`; n.close() }
            setTimeout(() => n.close(), 8000)
          } catch {}
        }
        break
      }
    }
  }
}

  async function runNotification(
    userId: string,
    config: any,
    scheduledTime: string
  ) {
    const daysBefore = config?.deadline_days_before || 3
    const notifs     = await fetchNotifications(userId, daysBefore)

    // Filtra según configuración
    const filtered = notifs.filter(n => {
      if (n.type === 'overdue' || n.type === 'due_today' || n.type === 'due_soon') {
        return config.deadline_alerts
      }
      if (n.icon === '🔄') return config.recurring_reminders
      return true
    })

    setNotifications(notifs)

    // Marca como notificado para no repetir
    markNotified(scheduledTime)

    if (filtered.length === 0) return

    // Sonido según urgencia
    const urgent = filtered.filter(n => n.type === 'overdue' || n.type === 'due_today')
    if (urgent.length > 0) {
      playUrgentSound()
    } else {
      playReminderSound()
    }

    // Notificación del navegador
    if (Notification.permission !== 'granted') return

    // Una sola notificación resumen en lugar de spam
    const title   = urgent.length > 0
      ? `⚠️ ${urgent.length} alerta${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''}`
      : `📅 Tienes ${filtered.length} recordatorio${filtered.length > 1 ? 's' : ''} hoy`

    const body = filtered.slice(0, 3).map(n => `${n.icon} ${n.title}: ${n.message}`).join('\n')

    try {
      const n = new Notification(`KronoMeta · ${title}`, {
        body,
        icon:   '/icons/icon-192x192.png',
        badge:  '/icons/icon-72x72.png',
        tag:    'kronometa-daily',  // mismo tag = reemplaza la anterior
        silent: true,
      })

      n.onclick = () => {
        window.focus()
        window.location.href = '/dashboard'
        n.close()
      }

      setTimeout(() => n.close(), 10000)
    } catch {}
  }

  if (!showBanner || permission === 'granted') return null

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
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '360px', width: 'calc(100% - 32px)',
      animation: 'pwa-slide-up 0.4s ease forwards',
    }}>
      <span style={{ fontSize: '22px', flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#F1F5F9', marginBottom: '2px' }}>
          Activar notificaciones
        </div>
        <div style={{ fontSize: '11px', color: '#64748B' }}>
          Recibe alertas a la hora que configures
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
        onClick={() => setShowBanner(false)}
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