'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Bell, Clock, Calendar, Repeat2, Trophy, CheckCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Settings {
  enabled: boolean
  daily_reminder: boolean
  daily_reminder_time: string
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
  daily_reminder_time:  '09:00',
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
      setSettings({
        enabled:              data.enabled,
        daily_reminder:       data.daily_reminder,
        daily_reminder_time:  data.daily_reminder_time?.slice(0, 5) || '09:00',
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
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        daily_reminder_time: settings.daily_reminder_time + ':00',
        updated_at: new Date().toISOString(),
      })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  function update(key: keyof Settings, value: any) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid var(--border)',
    gap: '16px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px', flex: 1,
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={15} color="var(--amber)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Notificaciones</span>
        </div>
        <Toggle
          value={settings.enabled}
          onChange={v => update('enabled', v)}
          color="var(--cyan)"
        />
      </div>

      <div style={{ opacity: settings.enabled ? 1 : 0.4, transition: 'opacity 0.2s', pointerEvents: settings.enabled ? 'auto' : 'none' }}>

        {/* RECORDATORIO DIARIO */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconBoxStyle('var(--cyan)')}>
              <Clock size={15} color="var(--cyan)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Recordatorio diario
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Recibe un resumen diario de tus metas y hábitos
              </div>
            </div>
          </div>
          <Toggle
            value={settings.daily_reminder}
            onChange={v => update('daily_reminder', v)}
            color="var(--cyan)"
          />
        </div>

        {/* HORA DEL RECORDATORIO */}
        {settings.daily_reminder && (
          <div style={{ ...rowStyle, paddingLeft: '42px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Hora del recordatorio</div>
            </div>
            <input
              type="time"
              value={settings.daily_reminder_time}
              onChange={e => update('daily_reminder_time', e.target.value)}
              style={{
                padding: '7px 12px',
                background: '#1a1a2e', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)',
                fontSize: '13px', outline: 'none', colorScheme: 'dark',
                fontFamily: 'var(--font-mono)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        )}

        {/* ALERTAS DE VENCIMIENTO */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconBoxStyle('var(--red)')}>
              <Calendar size={15} color="var(--red)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Alertas de vencimiento
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Aviso cuando una meta o submeta está por vencer
              </div>
            </div>
          </div>
          <Toggle
            value={settings.deadline_alerts}
            onChange={v => update('deadline_alerts', v)}
            color="var(--red)"
          />
        </div>

        {/* DÍAS ANTES */}
        {settings.deadline_alerts && (
          <div style={{ ...rowStyle, paddingLeft: '42px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
              Avisar con cuántos días de anticipación
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => update('deadline_days_before', Math.max(1, settings.deadline_days_before - 1))}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>−</button>
              <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)', minWidth: '24px', textAlign: 'center' }}>
                {settings.deadline_days_before}
              </span>
              <button onClick={() => update('deadline_days_before', Math.min(14, settings.deadline_days_before + 1))}
                style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: 'var(--text)', fontSize: '16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>+</button>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>días antes</span>
            </div>
          </div>
        )}

        {/* HÁBITOS */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconBoxStyle('var(--green)')}>
              <CheckCircle size={15} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Recordatorio de hábitos
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Recuérdame completar mis hábitos diarios
              </div>
            </div>
          </div>
          <Toggle
            value={settings.habit_reminders}
            onChange={v => update('habit_reminders', v)}
            color="var(--green)"
          />
        </div>

        {/* TAREAS RECURRENTES */}
        <div style={rowStyle}>
          <div style={labelStyle}>
            <div style={iconBoxStyle('var(--purple)')}>
              <Repeat2 size={15} color="var(--purple)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Tareas recurrentes
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Aviso diario para marcar tus tareas recurrentes
              </div>
            </div>
          </div>
          <Toggle
            value={settings.recurring_reminders}
            onChange={v => update('recurring_reminders', v)}
            color="var(--purple)"
          />
        </div>

        {/* LOGROS */}
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div style={labelStyle}>
            <div style={iconBoxStyle('var(--amber)')}>
              <Trophy size={15} color="var(--amber)" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                Alertas de logros
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                Notificación al desbloquear un logro o subir de nivel
              </div>
            </div>
          </div>
          <Toggle
            value={settings.achievement_alerts}
            onChange={v => update('achievement_alerts', v)}
            color="var(--amber)"
          />
        </div>

        {/* PREVIEW */}
        <div style={{
          marginTop: '16px', padding: '12px 16px',
          background: 'var(--surface2)', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            RESUMEN DE CONFIGURACIÓN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {settings.daily_reminder && (
              <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--cyan)' }}>⏰</span>
                Recordatorio diario a las <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{settings.daily_reminder_time}</strong>
              </div>
            )}
            {settings.deadline_alerts && (
              <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--red)' }}>🔔</span>
                Alertas de vencimiento con <strong style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{settings.deadline_days_before}</strong> días de anticipación
              </div>
            )}
            {settings.habit_reminders && (
              <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--green)' }}>✅</span>
                Recordatorio de hábitos activo
              </div>
            )}
            {settings.recurring_reminders && (
              <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--purple)' }}>🔄</span>
                Recordatorio de tareas recurrentes activo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOTA IMPORTANTE */}
      <div style={{
        marginTop: '16px', padding: '10px 14px',
        background: '#FFB80010', border: '1px solid #FFB80030',
        borderRadius: 'var(--radius-sm)', fontSize: '12px',
        color: 'var(--muted)', lineHeight: 1.6,
      }}>
        <span style={{ color: 'var(--amber)' }}>ℹ️</span>{' '}
        Las notificaciones se muestran dentro de la app mediante la campana 🔔 en el topbar. Para notificaciones push del sistema, instala KronoMeta como app en tu dispositivo.
      </div>

      {/* GUARDAR */}
      {saved && (
        <div style={{
          marginTop: '12px', padding: '10px 14px',
          background: '#00FF8815', border: '1px solid #00FF8833',
          borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--green)',
        }}>
          ✓ Configuración guardada correctamente
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