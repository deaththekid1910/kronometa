'use client'

import { useState } from 'react'
import { BinanceProfile } from '@/types/savings'
import { CURRENCIES, parseAmount, saveProfile } from '@/lib/savings'
import { fieldInput, fieldLabel } from './Modal'
import Button from '@/components/ui/Button'
import { ShieldCheck } from 'lucide-react'

interface Props {
  userId: string
  profile: BinanceProfile | null      // null = configuración inicial
  onSaved: (p: BinanceProfile) => void
  onCancel?: () => void
}

const ACCENT = '#F0B90B'   // amarillo Binance

// Datos de la cuenta de Binance que el usuario quiere tener a mano.
// No se piden contraseñas ni claves API: KronoMeta no se conecta a Binance.
export default function BinanceProfileForm({ userId, profile, onSaved, onCancel }: Props) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName,  setLastName]  = useState(profile?.last_name || '')
  const [email,     setEmail]     = useState(profile?.email || '')
  const [uid,       setUid]       = useState(profile?.binance_uid || '')
  const [currency,  setCurrency]  = useState(profile?.currency || 'USDT')
  const [balance,   setBalance]   = useState('')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  const isSetup = !profile

  async function handleSave() {
    setError('')
    if (!firstName.trim()) { setError('Escribe tu nombre.'); return }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('El correo no parece válido.'); return }
    if (uid.trim() && !/^\d{5,15}$/.test(uid.trim())) { setError('El Binance ID son solo números (normalmente 8-10 dígitos).'); return }

    let initial: number | undefined
    if (isSetup) {
      initial = balance.trim() ? parseAmount(balance) : 0
      if (Number.isNaN(initial) || initial < 0) { setError('El saldo inicial debe ser un número positivo.'); return }
    }

    setSaving(true)
    const { data, error: err } = await saveProfile(userId, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      binance_uid: uid.trim() || null,
      currency,
    }, initial)
    setSaving(false)
    if (err || !data) { setError('No se pudo guardar. Inténtalo de nuevo.'); return }
    onSaved({ ...data, balance: Number(data.balance) } as BinanceProfile)
  }

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = ACCENT }
  const blur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = 'var(--border)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div>
          <label style={fieldLabel}>NOMBRE *</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus={isSetup}
            autoComplete="given-name" placeholder="Tu nombre" style={fieldInput} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={fieldLabel}>APELLIDO</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)}
            autoComplete="family-name" placeholder="Tu apellido" style={fieldInput} onFocus={focus} onBlur={blur} />
        </div>
      </div>

      <div>
        <label style={fieldLabel}>CORREO DE BINANCE</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          autoComplete="email" placeholder="correo@ejemplo.com" style={fieldInput} onFocus={focus} onBlur={blur} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div>
          <label style={fieldLabel}>BINANCE ID (UID)</label>
          <input value={uid} onChange={e => setUid(e.target.value.replace(/\D/g, ''))} inputMode="numeric"
            placeholder="Ej: 123456789" style={{ ...fieldInput, fontFamily: 'var(--font-mono)' }} onFocus={focus} onBlur={blur} />
        </div>
        <div>
          <label style={fieldLabel}>MONEDA DE AHORRO</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ ...fieldInput, cursor: 'pointer', colorScheme: 'dark' }} onFocus={focus} onBlur={blur}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {isSetup && (
        <div>
          <label style={fieldLabel}>SALDO ACTUAL EN BINANCE</label>
          <input value={balance} onChange={e => setBalance(e.target.value)} inputMode="decimal"
            placeholder="Ej: 350.00" style={{ ...fieldInput, fontFamily: 'var(--font-mono)', fontSize: '16px' }}
            onFocus={focus} onBlur={blur} />
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '5px', lineHeight: 1.4 }}>
            Lo que tienes hoy en {currency}. Podrás ajustarlo cuando quieras.
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
        background: '#F0B90B0D', border: '1px solid #F0B90B33',
        fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5,
      }}>
        <ShieldCheck size={15} color={ACCENT} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          KronoMeta <strong style={{ color: 'var(--text)' }}>no se conecta a Binance</strong> ni te pedirá contraseñas o claves API.
          Estos datos son para tu referencia y el saldo lo llevas tú aquí.
        </span>
      </div>

      {error && (
        <div role="alert" style={{
          padding: '9px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
          background: '#FF386015', border: '1px solid #FF386033', color: 'var(--red)',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        {onCancel && (
          <Button variant="ghost" size="md" onClick={onCancel} style={{ flex: 1 }}>Cancelar</Button>
        )}
        <Button
          variant="primary" size="md" loading={saving} onClick={handleSave}
          style={{ flex: 2, background: ACCENT, color: '#0A0E1A', justifyContent: 'center' }}
        >
          {isSetup ? 'Guardar y empezar a ahorrar' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
