'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchNotifications } from '@/lib/notifications'
import { localToday } from '@/lib/dailyTasks'
import { useNotificationStore } from '@/store/notificationStore'
import { showAppNotification } from '@/lib/pushNotify'
import {
  playNotificationSound,
  playUrgentSound,
  playReminderSound,
  unlockAudio,
} from '@/lib/notificationSound'

// Clave en localStorage para rastrear cuándo se notificó
const NOTIF_KEY = 'km_last_notif'

interface NotifRecord {
  date: string        // YYYY-MM-DD
  times: string[]     // ['09:00', '18:00'] ya notificadas hoy
}

// Fecha "de hoy" en la zona horaria LOCAL del usuario (no UTC). Usar
// toISOString() aquí desalinea el corte de día con localToday()/getDay(),
// que es lo que usan las tareas diarias y el horario para decidir "hoy".
function localDateKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const today  = localDateKey()
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
  const today  = localDateKey()
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
      } else if (Notification.permission === 'denied') {
        // Antes esto quedaba invisible: si el usuario había denegado el
        // permiso (aquí o en otra sesión), nunca se le avisaba y las alarmas
        // fallaban en silencio sin ninguna pista de por qué.
        setShowBanner(true)
      }
    }

    // Desbloquea el audio en el primer gesto del usuario para que los
    // sonidos disparados por el temporizador después sí suenen.
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    // Verifica cada minuto si es hora de notificar
    const interval = setInterval(checkSchedule, 60 * 1000)
    checkSchedule() // verifica inmediatamente al cargar
    return () => {
      clearInterval(interval)
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return
    unlockAudio() // este click es un gesto válido para desbloquear audio
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

    // Solo se desactiva todo si el usuario apagó explícitamente las notificaciones.
    // Si no existe configuración guardada aún, se asume activado por defecto.
    if (config && config.enabled === false) return

    const today = new Date().toISOString().split('T')[0]

    // ── 1. RECORDATORIO DIARIO (resumen) — requiere config con daily_reminder ──
    if (config && config.daily_reminder) {
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

      for (const t of times) {
        const scheduledTime = t.time.slice(0, 5)
        if (matchesScheduledTime(scheduledTime) && !alreadyNotifiedToday(scheduledTime)) {
          await runNotification(user.id, config, scheduledTime)
          break // Solo una notificación por ciclo de verificación
        }
      }
    }

    // ── 2. TAREAS RECURRENTES — independiente del recordatorio diario ──
    // Se omite solo si el usuario apagó "recurring_reminders" explícitamente.
    if (!config || config.recurring_reminders !== false) {
      const { data: recurringTasks } = await supabase
        .from('recurring_tasks')
        .select('id, title, notification_times, goal_id')
        .eq('user_id', user.id)
        .eq('archived', false)
        .gte('deadline', today)

      for (const rt of recurringTasks || []) {
        const rtTimes: string[] = Array.isArray(rt.notification_times) && rt.notification_times.length > 0
          ? rt.notification_times
          : ['09:00']

        for (const t of rtTimes) {
          const scheduledTime = (t || '').slice(0, 5)
          const tKey = `rt_${rt.id}_${scheduledTime}`
          if (matchesScheduledTime(scheduledTime) && !alreadyNotifiedToday(tKey)) {
            markNotified(tKey)
            playReminderSound()
            await showAppNotification('KronoMeta · 🔄 Tarea recurrente', {
              body:   `"${rt.title}" · pendiente de hoy`,
              icon:   '/icons/icon-192x192.png',
              badge:  '/icons/icon-72x72.png',
              tag:    `rt-${rt.id}-${scheduledTime}`,
              url:    `/goals/${rt.goal_id}`,
            })
            break
          }
        }
      }
    }

    // ── 3. TAREAS DIARIAS — recordatorio con hora propia (zona horaria local) ──
    if (!config || config.enabled !== false) {
      const { data: dailyTasks } = await supabase
        .from('daily_tasks')
        .select('id, title, reminder_time')
        .eq('user_id', user.id)
        .eq('task_date', localToday())
        .is('completed_at', null)
        .not('reminder_time', 'is', null)

      for (const dt of dailyTasks || []) {
        const scheduledTime = (dt.reminder_time || '').slice(0, 5)
        if (!scheduledTime) continue
        const tKey = `dt_${dt.id}_${scheduledTime}`
        if (matchesScheduledTime(scheduledTime) && !alreadyNotifiedToday(tKey)) {
          markNotified(tKey)
          playReminderSound()
          await showAppNotification('KronoMeta · ✅ Tarea diaria', {
            body:   `"${dt.title}" · es hora`,
            icon:   '/icons/icon-192x192.png',
            badge:  '/icons/icon-72x72.png',
            tag:    `dt-${dt.id}-${scheduledTime}`,
            url:    '/daily',
          })
        }
      }
    }

    // ── 3.5 HÁBITOS — recordatorio diario propio, omite si ya se marcó hoy ──
    if (!config || config.habit_reminders !== false) {
      const { data: habits } = await supabase
        .from('goals')
        .select('id, title, reminder_time')
        .eq('user_id', user.id)
        .eq('type', 'habit')
        .eq('archived', false)
        .not('reminder_time', 'is', null)

      if (habits && habits.length > 0) {
        const { data: doneToday } = await supabase
          .from('habit_logs')
          .select('goal_id')
          .in('goal_id', habits.map(h => h.id))
          .eq('logged_date', today)

        const doneIds = new Set((doneToday || []).map(l => l.goal_id))

        for (const h of habits) {
          if (doneIds.has(h.id)) continue
          const scheduledTime = (h.reminder_time || '').slice(0, 5)
          if (!scheduledTime) continue
          const hKey = `hab_${h.id}_${scheduledTime}`
          if (matchesScheduledTime(scheduledTime) && !alreadyNotifiedToday(hKey)) {
            markNotified(hKey)
            playReminderSound()
            await showAppNotification('KronoMeta · ↺ Hábito', {
              body:   `"${h.title}" · es hora`,
              icon:   '/icons/icon-192x192.png',
              badge:  '/icons/icon-72x72.png',
              tag:    `hab-${h.id}-${scheduledTime}`,
              url:    `/habits/${h.id}`,
            })
          }
        }
      }
    }

    // ── 4. HORARIO — bloques recurrentes que aplican hoy: avisa al INICIAR y al TERMINAR ──
    if (!config || config.enabled !== false) {
      const dow = new Date().getDay() // 0=Domingo ... 6=Sábado

      const { data: scheduleBlocks } = await supabase
        .from('schedule_blocks')
        .select('id, title, start_time, end_time, days_of_week, notify, active')
        .eq('user_id', user.id)
        .eq('active', true)
        .eq('notify', true)
        .contains('days_of_week', [dow])

      for (const sb of scheduleBlocks || []) {
        // ── Alarma de INICIO ──
        const startTime = (sb.start_time || '').slice(0, 5)
        if (startTime) {
          const startKey = `sb_${sb.id}_start_${startTime}`
          if (matchesScheduledTime(startTime) && !alreadyNotifiedToday(startKey)) {
            markNotified(startKey)
            playUrgentSound()
            await showAppNotification('KronoMeta · ⏰ Horario', {
              body:   `"${sb.title}" · es hora de iniciar`,
              icon:   '/icons/icon-192x192.png',
              badge:  '/icons/icon-72x72.png',
              tag:    `sb-${sb.id}-start-${startTime}`,
              url:    '/schedule',
            })
          }
        }

        // ── Alarma de FIN (solo si tiene hora de fin) ──
        const endTime = (sb.end_time || '').slice(0, 5)
        if (endTime) {
          const endKey = `sb_${sb.id}_end_${endTime}`
          if (matchesScheduledTime(endTime) && !alreadyNotifiedToday(endKey)) {
            markNotified(endKey)
            playReminderSound()
            await showAppNotification('KronoMeta · 🏁 Horario', {
              body:   `"${sb.title}" · hora de terminar`,
              icon:   '/icons/icon-192x192.png',
              badge:  '/icons/icon-72x72.png',
              tag:    `sb-${sb.id}-end-${endTime}`,
              url:    '/schedule',
            })
          }
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

    // Notificación del navegador (vía service worker; funciona en móvil)
    const title   = urgent.length > 0
      ? `⚠️ ${urgent.length} alerta${urgent.length > 1 ? 's' : ''} urgente${urgent.length > 1 ? 's' : ''}`
      : `📅 Tienes ${filtered.length} recordatorio${filtered.length > 1 ? 's' : ''} hoy`

    const body = filtered.slice(0, 3).map(n => `${n.icon} ${n.title}: ${n.message}`).join('\n')

    await showAppNotification(`KronoMeta · ${title}`, {
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag:   'kronometa-daily',  // mismo tag = reemplaza la anterior
      url:   '/dashboard',
    })
  }

  if (!showBanner || permission === 'granted') return null

  const denied = permission === 'denied'

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 998,
      background: '#131829',
      border: `1px solid ${denied ? '#FF386044' : '#FFB80044'}`,
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '360px', width: 'calc(100% - 32px)',
      animation: 'pwa-slide-up 0.4s ease forwards',
    }}>
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{denied ? '🔕' : '🔔'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#F1F5F9', marginBottom: '2px' }}>
          {denied ? 'Notificaciones bloqueadas' : 'Activar notificaciones'}
        </div>
        <div style={{ fontSize: '11px', color: '#64748B' }}>
          {denied
            ? 'Las alarmas no sonarán hasta que las actives en los ajustes del navegador (ícono 🔒 junto a la URL)'
            : 'Recibe alertas a la hora que configures'}
        </div>
      </div>
      {!denied && (
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
      )}
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