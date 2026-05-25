'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { hashPIN, verifyPIN } from '@/lib/diary'
import { createClient } from '@/lib/supabase'

interface Props {
  hasPin: boolean
  pinHash: string
  onUnlock: () => void
}

export default function DiaryLock({ hasPin, pinHash, onUnlock }: Props) {
  const [pin,        setPin]        = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [showPin,    setShowPin]    = useState(false)
  const [step,       setStep]       = useState<'enter' | 'create' | 'confirm'>(!hasPin ? 'create' : 'enter')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [shake,      setShake]      = useState(false)

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  function handlePinChange(index: number, value: string, isConfirm = false) {
    if (!/^\d*$/.test(value)) return
    const arr = isConfirm ? [...confirmPin] : [...pin]
    arr[index] = value.slice(-1)
    isConfirm ? setConfirmPin(arr) : setPin(arr)

    if (value && index < 3) {
      const next = document.getElementById(`${isConfirm ? 'c' : ''}pin-${index + 1}`)
      next?.focus()
    }

    // Auto-submit cuando los 4 dígitos están completos
    if (value && index === 3) {
      const full = [...arr.slice(0, 3), value.slice(-1)].join('')
      if (full.length === 4) {
        setTimeout(() => {
          if (isConfirm) handleConfirmCreate([...arr.slice(0, 3), value.slice(-1)])
          else if (step === 'enter') handleVerify([...arr.slice(0, 3), value.slice(-1)])
          else if (step === 'create') {
            setPin([...arr.slice(0, 3), value.slice(-1)])
            setStep('confirm')
          }
        }, 100)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number, isConfirm = false) {
    if (e.key === 'Backspace') {
      const arr = isConfirm ? [...confirmPin] : [...pin]
      if (!arr[index] && index > 0) {
        arr[index - 1] = ''
        isConfirm ? setConfirmPin(arr) : setPin(arr)
        const prev = document.getElementById(`${isConfirm ? 'c' : ''}pin-${index - 1}`)
        prev?.focus()
      }
    }
  }

  async function handleVerify(digits?: string[]) {
    const code = (digits || pin).join('')
    if (code.length < 4) return
    setLoading(true)
    setError('')
    const ok = await verifyPIN(code, pinHash)
    if (ok) {
      onUnlock()
    } else {
      setError('PIN incorrecto')
      setPin(['', '', '', ''])
      triggerShake()
      document.getElementById('pin-0')?.focus()
    }
    setLoading(false)
  }

  async function handleConfirmCreate(digits?: string[]) {
    const code    = pin.join('')
    const confirm = (digits || confirmPin).join('')
    if (confirm.length < 4) return
    if (code !== confirm) {
      setError('Los PINs no coinciden')
      setConfirmPin(['', '', '', ''])
      triggerShake()
      document.getElementById('cpin-0')?.focus()
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const hash = await hashPIN(code)
    await supabase.from('diary_settings').upsert({
      user_id:  user.id,
      pin_hash: hash,
    })
    onUnlock()
    setLoading(false)
  }

  const inputStyle = (filled: boolean): React.CSSProperties => ({
    width: '52px', height: '64px',
    background: filled ? '#00F5FF15' : '#131829',
    border: `2px solid ${filled ? '#00F5FF66' : '#1F2937'}`,
    borderRadius: '12px',
    fontSize: '24px', fontWeight: 700,
    color: showPin ? '#00F5FF' : 'transparent',
    textShadow: showPin ? 'none' : '0 0 0 #00F5FF',
    textAlign: 'center' as const,
    outline: 'none', cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'JetBrains Mono, monospace',
    caretColor: 'transparent',
  })

  function PinDots({ values, prefix }: { values: string[]; prefix: string }) {
    return (
      <div style={{
        display: 'flex', gap: '12px', justifyContent: 'center',
        animation: shake ? 'shake 0.4s ease' : 'none',
      }}>
        {values.map((v, i) => (
          <input
            key={i}
            id={`${prefix}pin-${i}`}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={e => handlePinChange(i, e.target.value, prefix === 'c')}
            onKeyDown={e => handleKeyDown(e, i, prefix === 'c')}
            style={inputStyle(!!v)}
            autoFocus={i === 0}
            onFocus={e => e.target.style.borderColor = '#00F5FF'}
            onBlur={e => e.target.style.borderColor = v ? '#00F5FF66' : '#1F2937'}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0E1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif',
    }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0); }
          20%      { transform:translateX(-8px); }
          40%      { transform:translateX(8px); }
          60%      { transform:translateX(-6px); }
          80%      { transform:translateX(6px); }
        }
        @keyframes lock-appear {
          from { opacity:0; transform:translateY(16px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        width: '100%', maxWidth: '360px',
        background: '#131829',
        border: '1px solid #1F2937',
        borderRadius: '20px',
        padding: '36px 28px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'lock-appear 0.4s ease',
      }}>

        {/* ICONO */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #00F5FF15, #B026FF15)',
          border: '1px solid #00F5FF33',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 30px #00F5FF22',
        }}>
          {step === 'create' ? <Shield size={32} color="#00F5FF" /> : <Lock size={32} color="#00F5FF" />}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#F1F5F9', margin: '0 0 6px' }}>
          {step === 'create'  ? 'Crea tu PIN secreto' :
           step === 'confirm' ? 'Confirma tu PIN' :
           'Mi Diario'}
        </h2>

        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px', lineHeight: 1.5 }}>
          {step === 'create'  ? 'Elige 4 dígitos para proteger tu diario. Solo tú lo sabrás.' :
           step === 'confirm' ? 'Ingresa el mismo PIN para confirmar.' :
           'Ingresa tu PIN para acceder a tu diario personal.'}
        </p>

        {/* DOTS */}
        {step !== 'confirm'
          ? <PinDots values={pin} prefix="" />
          : <PinDots values={confirmPin} prefix="c" />
        }

        {/* MOSTRAR/OCULTAR PIN */}
        <button
          onClick={() => setShowPin(p => !p)}
          style={{
            background: 'none', border: 'none', color: '#374151',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '6px', fontSize: '12px', margin: '16px auto 0',
          }}
        >
          {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPin ? 'Ocultar' : 'Mostrar'} PIN
        </button>

        {/* ERROR */}
        {error && (
          <div style={{
            marginTop: '16px', padding: '10px 14px',
            background: '#FF386015', border: '1px solid #FF386033',
            borderRadius: '8px', fontSize: '13px', color: '#FF3860',
          }}>
            {error}
          </div>
        )}

        {/* BOTÓN MANUAL */}
        <button
          onClick={() => {
            if (step === 'enter')   handleVerify()
            else if (step === 'create') setStep('confirm')
            else handleConfirmCreate()
          }}
          disabled={loading || (step === 'enter' ? pin.join('').length < 4 : step === 'confirm' ? confirmPin.join('').length < 4 : pin.join('').length < 4)}
          style={{
            marginTop: '24px', width: '100%',
            padding: '13px',
            background: '#00F5FF',
            border: 'none', borderRadius: '10px',
            color: '#0A0E1A', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 0 20px #00F5FF44',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Verificando...' :
           step === 'enter' ? 'Entrar al diario' :
           step === 'create' ? 'Continuar' : 'Crear PIN'}
        </button>

        {step === 'confirm' && (
          <button onClick={() => { setStep('create'); setConfirmPin(['','','','']); setError('') }} style={{
            marginTop: '12px', background: 'none', border: 'none',
            color: '#64748B', fontSize: '13px', cursor: 'pointer',
          }}>
            ← Cambiar PIN
          </button>
        )}
      </div>
    </div>
  )
}