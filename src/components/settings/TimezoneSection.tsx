'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Globe } from 'lucide-react'
import Button from '@/components/ui/Button'

const TIMEZONES = [
  { label: 'Venezuela (VET) UTC-4',        value: 'America/Caracas' },
  { label: 'Colombia (COT) UTC-5',          value: 'America/Bogota' },
  { label: 'México Ciudad (CST) UTC-6',     value: 'America/Mexico_City' },
  { label: 'Argentina (ART) UTC-3',         value: 'America/Argentina/Buenos_Aires' },
  { label: 'Chile (CLT) UTC-3',             value: 'America/Santiago' },
  { label: 'Perú (PET) UTC-5',              value: 'America/Lima' },
  { label: 'Ecuador (ECT) UTC-5',           value: 'America/Guayaquil' },
  { label: 'Bolivia (BOT) UTC-4',           value: 'America/La_Paz' },
  { label: 'Paraguay (PYT) UTC-4',          value: 'America/Asuncion' },
  { label: 'Uruguay (UYT) UTC-3',           value: 'America/Montevideo' },
  { label: 'España (CET) UTC+1',            value: 'Europe/Madrid' },
  { label: 'Estados Unidos Este UTC-5',     value: 'America/New_York' },
  { label: 'Estados Unidos Oeste UTC-8',    value: 'America/Los_Angeles' },
]

interface Props {
  userId: string
}

export default function TimezoneSection({ userId }: Props) {
  const [timezone, setTimezone] = useState('')
  const [detected, setDetected] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [localTime, setLocalTime] = useState('')

  useEffect(() => {
    const auto = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetected(auto)

    const match = TIMEZONES.find(t => t.value === auto)
    setTimezone(match ? auto : 'America/Caracas')

    const tick = () => {
      setLocalTime(new Date().toLocaleTimeString('es-VE', {
        timeZone: timezone || auto,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timezone])

  async function handleSave() {
    setLoading(true)
    setSuccess(false)
    const supabase = createClient()
    await supabase.from('goals').update({ timezone }).eq('user_id', userId)
    await supabase.from('habit_logs').update({ timezone }).eq('user_id', userId)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setLoading(false)
  }

  function handleAutoDetect() {
    const auto = Intl.DateTimeFormat().resolvedOptions().timeZone
    const match = TIMEZONES.find(t => t.value === auto)
    setTimezone(match ? auto : 'America/Caracas')
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', cursor: 'pointer',
    colorScheme: 'dark',
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Globe size={15} color="var(--green)" />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Zona horaria</span>
      </div>

      {/* HORA EN VIVO */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#00FF8808', border: '1px solid #00FF8822',
        borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px',
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>Hora local actual</div>
          <div style={{ fontSize: '22px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green)' }}>
            {localTime}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '2px' }}>Detectada automáticamente</div>
          <div style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{detected}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            ZONA HORARIA
          </label>
          <select value={timezone} onChange={e => setTimezone(e.target.value)} style={selectStyle}>
            {TIMEZONES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button onClick={handleAutoDetect} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '8px 14px',
          color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
          width: 'fit-content', transition: 'all var(--transition)',
        }}>
          <Globe size={13} />
          Detectar automáticamente
        </button>

        {success && (
          <div style={{ background: '#00FF8815', border: '1px solid #00FF8833', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', color: 'var(--green)' }}>
            ✓ Zona horaria actualizada en todas tus metas y hábitos
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleSave}
            style={{ background: 'var(--green)', color: '#0A0E1A' }}
          >
            Guardar zona horaria
          </Button>
        </div>
      </div>
    </div>
  )
}