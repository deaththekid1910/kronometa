'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, Clock, Calendar, Repeat2, Trophy, CheckCircle, Plus, X, Volume2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { showAppNotification } from '@/lib/pushNotify'
import { playNotificationSound, unlockAudio } from '@/lib/notificationSound'

interface NotifTime {
  id: string
  time: string
}

interface Settings {
  enabled: boolean
  daily_reminder: boolean
  reminder_times: NotifTime[]
  deadline_alerts: boolean
  deadline_days_before: number
  habit_reminders: boolean
  recurring_reminders: boolean
  achievement_alerts: boolean
  timezone: string
}

const DEFAULT: Settings = {
  enabled:              true,
  daily_reminder:       true,
  reminder_times:       [{ id: '1', time: '09:00' }],
  deadline_alerts:      true,
  deadline_days_before: 3,
  habit_reminders:      true,
  recurring_reminders:  true,
  achievement_alerts:   true,
  timezone:             'America/Caracas',
}

interface Props { userId: string }

function Toggle({ value, onChange, color = 'var(--cyan)' }: {
  value: boolean
  onChange: (v: boolean) => void
  color?: string
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px',
        background: value ? color : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
        boxShadow: value ? `0 0 10px ${color}44` : 'none',
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

export default function NotificationsSection({ userId }: Props) {
  const [settings, setSettings] = useState<Settings>(DEFAULT)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [testing,  setTesting]  = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'no-permission' | null>(null)

  useEffect(() => { loadSettings() }, [userId])

  async function loadSettings() {
    if (!userId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      let times: NotifTime[] = [{ id: '1', time: '09:00' }]
      try {
        const raw = data.daily_reminder_time
        if (raw && raw.includes('[')) {
          times = JSON.parse(raw)
        } else if (raw) {
          times = [{ id: '1', time: raw.slice(0, 5) }]
        }
      } catch {
        times = [{ id: '1', time: (data.daily_reminder_time || '09:00').slice(0, 5) }]
      }

      setSettings({
        enabled:              data.enabled,
        daily_reminder:       data.daily_reminder,
        reminder_times:       times,
        deadline_alerts:      data.deadline_alerts,
        deadline_days_before: data.deadline_days_before,
        habit_reminders:      data.habit_reminders,
        recurring_reminders:  data.recurring_reminders,
        achievement_alerts:   data.achievement_alerts,
        timezone:             data.timezone,
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    // Guarda los horarios como JSON en daily_reminder_time
    await supabase
      .from('notification_settings')
      .upsert({
        user_id:              userId,
        enabled:              settings.enabled,
        daily_reminder:       settings.daily_reminder,
        daily_reminder_time:  JSON.stringify(settings.reminder_times),
        deadline_alerts:      settings.deadline_alerts,
        deadline_days_before: settings.deadline_days_before,
        habit_reminders:      settings.habit_reminders,
        recurring_reminders:  settings.recurring_reminders,
        achievement_alerts:   settings.achievement_alerts,
        timezone:             settings.timezone,
        updated_at:           new Date().toISOString(),
      })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  function update(key: keyof Settings, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // Dispara sonido + notificación de inmediato, sin esperar el temporizador.
  // Este click también sirve como gesto del usuario para desbloquear el audio.
  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    unlockAudio()
    playNotificationSound()

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted') {
        setTestResult('no-permission')
      } else {
        await showAppNotification('KronoMeta · 🔔 Prueba', {
          body: 'Si ves esto y escuchaste el sonido, las alarmas funcionan.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'kronometa-test',
        })
        setTestResult('ok')
      }
    } else {
      setTestResult('no-permission')
    }
    setTesting(false)
  }

  function addTime() {
    if (settings.reminder_times.length >= 8) return
    const id = Date.now().toString()
    update('reminder_times', [...settings.reminder_times, { id, time: '12:00' }])
  }

  function removeTime(id: string) {
    if (settings.reminder_times.length <= 1) return
    update('reminder_times', settings.reminder_times.filter(t => t.id !== id))
  }

  function updateTime(id: string, time: string) {
    update('reminder_times', settings.reminder_times.map(t => t.id === id ? { ...t, time } : t))
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid var(--border)', gap: '16px',
  }

  const labelStyle = (color: string): React.CSSProperties => ({
    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
    background: color + '15', border: `1px solid ${color}30`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  })

  if (loading) return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      <div style={{ fontSize: '13px', color: 'var(--dim)' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={15} color="var(--amber)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Notificaciones</span>
        </div>
        <Toggle value={settings.enabled} onChange={v => update('enabled', v)} color="var(--cyan)" />
      </div>

      <div style={{
        opacity: settings.enabled ? 1 : 0.4,
        transition: 'opacity 0.2s',
        pointerEvents: settings.enabled ? 'auto' : 'none',
      }}>

        {/* ── RECORDATORIO DIARIO ── */}
        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={labelStyle('var(--cyan)')}>
              <Clock size={15} color="var(--cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Recordatorio diario
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Resumen diario de metas, hábitos y tareas
              </div>
            </div>
          </div>
          <Toggle
            value={settings.daily_reminder}
            onChange={v => update('daily_reminder', v)}
            color="var(--cyan)"
          />
        </div>

        {/* ── HORARIOS ── */}
        {settings.daily_reminder && (
          <div style={{
            marginLeft: '42px', marginBottom: '4px',
            display: 'flex', flexDirection: 'column', gap: '0',
          }}>
            <div style={{
              fontSize: '11px', color: 'var(--muted)',
              letterSpacing: '0.5px', padding: '10px 0 8px',
            }}>
              HORARIOS DE NOTIFICACIÓN
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {settings.reminder_times.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  background: '#0d1120', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'border-color var(--transition)',
                }}>
                  {/* NÚMERO */}
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--cyan)15', border: '1px solid var(--cyan)33',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: 'var(--cyan)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {i + 1}
                  </div>

                  {/* LABEL */}
                  <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                    {i === 0 ? 'Primera notificación' : `Notificación ${i + 1}`}
                  </span>

                  {/* INPUT HORA */}
                  <input
                    type="time"
                    value={t.time}
                    onChange={e => updateTime(t.id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--cyan)',
                      fontSize: '14px', fontWeight: 600, outline: 'none',
                      colorScheme: 'dark', fontFamily: 'var(--font-mono)',
                      cursor: 'pointer', minWidth: '110px',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />

                  {/* ELIMINAR */}
                  {settings.reminder_times.length > 1 && (
                    <button
                      onClick={() => removeTime(t.id)}
                      style={{
                        width: '26px', height: '26px', borderRadius: '6px',
                        background: '#FF386010', border: '1px solid #FF386022',
                        color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* AGREGAR HORARIO */}
            {settings.reminder_times.length < 8 && (
              <button
                onClick={addTime}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginTop: '8px', padding: '9px 14px',
                  background: 'transparent',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted)', fontSize: '12px',
                  cursor: 'pointer', width: '100%',
                  transition: 'all var(--transition)',
                  fontFamily: 'var(--font-sans)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cyan)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cyan)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
                }}
              >
                <Plus size={14} />
                Agregar otro horario
                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--dim)' }}>
                  {settings.reminder_times.length}/8
                </span>
              </button>
            )}

            {/* RESUMEN HORARIOS */}
            <div style={{
              marginTop: '10px', padding: '10px 14px',
              background: '#00F5FF08', border: '1px solid #00F5FF22',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Notificarás a las:</span>
              {settings.reminder_times
                .slice()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(t => (
                  <span key={t.id} style={{
                    fontSize: '12px', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', color: 'var(--cyan)',
                    background: 'var(--cyan)15', border: '1px solid var(--cyan)30',
                    padding: '2px 8px', borderRadius: '20px',
                  }}>
                    {t.time}
                  </span>
                ))
              }
            </div>
          </div>
        )}

        {/* ── ALERTAS DE VENCIMIENTO ── */}
        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={labelStyle('var(--red)')}>
              <Calendar size={15} color="var(--red)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Alertas de vencimiento
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Metas y submetas próximas a vencer
              </div>
            </div>
          </div>
          <Toggle
            value={settings.deadline_alerts}
            onChange={v => update('deadline_alerts', v)}
            color="var(--red)"
          />
        </div>

        {settings.deadline_alerts && (
          <div style={{
            marginLeft: '42px', padding: '10px 0 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
              Avisar con anticipación de
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => update('deadline_days_before', Math.max(1, settings.deadline_days_before - 1))}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >−</button>
              <span style={{
                fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: 'var(--red)', minWidth: '24px', textAlign: 'center',
              }}>
                {settings.deadline_days_before}
              </span>
              <button
                onClick={() => update('deadline_days_before', Math.min(14, settings.deadline_days_before + 1))}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>días</span>
            </div>
          </div>
        )}

        {/* ── HÁBITOS ── */}
        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={labelStyle('var(--green)')}>
              <CheckCircle size={15} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Hábitos diarios
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Recuerda completar tus hábitos
              </div>
            </div>
          </div>
          <Toggle
            value={settings.habit_reminders}
            onChange={v => update('habit_reminders', v)}
            color="var(--green)"
          />
        </div>

        {/* ── TAREAS RECURRENTES ── */}
        <div style={rowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={labelStyle('var(--purple)')}>
              <Repeat2 size={15} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Tareas recurrentes
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Aviso para marcar tus tareas recurrentes
              </div>
            </div>
          </div>
          <Toggle
            value={settings.recurring_reminders}
            onChange={v => update('recurring_reminders', v)}
            color="var(--purple)"
          />
        </div>

        {/* ── LOGROS ── */}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <div style={labelStyle('var(--amber)')}>
              <Trophy size={15} color="var(--amber)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Logros y niveles
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Al desbloquear un logro o subir de nivel
              </div>
            </div>
          </div>
          <Toggle
            value={settings.achievement_alerts}
            onChange={v => update('achievement_alerts', v)}
            color="var(--amber)"
          />
        </div>

        {/* ── PROBAR AHORA ── */}
        <div style={{
          marginTop: '16px', padding: '14px',
          background: '#0d1120', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '180px' }}>
            <div style={labelStyle('var(--cyan)')}>
              <Volume2 size={15} color="var(--cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>Probar alarma ahora</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Verifica sonido y notificación sin esperar la hora programada
              </div>
            </div>
          </div>
          <Button variant="secondary" size="sm" loading={testing} onClick={handleTest}>
            Probar
          </Button>
        </div>

        {testResult === 'ok' && (
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: '#00FF8815', border: '1px solid #00FF8833',
            borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--green)',
          }}>
            ✓ Sonido y notificación enviados. Si no escuchaste/viste nada, revisa el volumen del sistema y que el navegador tenga permitidas las notificaciones para este sitio.
          </div>
        )}
        {testResult === 'no-permission' && (
          <div style={{
            marginTop: '10px', padding: '10px 14px',
            background: '#FF386015', border: '1px solid #FF386033',
            borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--red)',
          }}>
            ✗ El navegador no tiene permiso para mostrar notificaciones (sonó el tono, pero la notificación visual no se mostrará). Actívalo desde el ícono 🔒/ⓘ junto a la URL del navegador.
          </div>
        )}

        {/* ── NOTA ── */}
        <div style={{
          marginTop: '16px', padding: '10px 14px',
          background: '#FFB80010', border: '1px solid #FFB80030',
          borderRadius: 'var(--radius-sm)', fontSize: '12px',
          color: 'var(--muted)', lineHeight: 1.6,
        }}>
          <span style={{ color: 'var(--amber)' }}>ℹ️</span>{' '}
          Las notificaciones suenan a la hora que configures (margen de ±2 min) y solo una vez por día por cada horario. Activa las notificaciones del sistema cuando aparezca el banner. Funcionan mientras la app siga abierta, aunque esté en otra pestaña o minimizada; si cierras la app por completo no podrán dispararse.
        </div>
      </div>

      {/* GUARDAR */}
      {saved && (
        <div style={{
          marginTop: '14px', padding: '10px 14px',
          background: '#00FF8815', border: '1px solid #00FF8833',
          borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--green)',
        }}>
          ✓ Configuración guardada
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button
          variant="primary" size="md"
          loading={saving}
          onClick={handleSave}
          style={{ background: 'var(--amber)', color: '#0A0E1A', boxShadow: '0 0 16px #FFB80044' }}
        >
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}