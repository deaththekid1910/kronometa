'use client'

import { useState } from 'react'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { hashPassword, verifyPassword } from '@/lib/diary'
import { createClient } from '@/lib/supabase'

interface Props {
  hasPin: boolean
  pinHash: string
  onUnlock: () => void
}

export default function DiaryLock({ hasPin, pinHash, onUnlock }: Props) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [step,      setStep]      = useState<'enter' | 'create' | 'confirm'>(!hasPin ? 'create' : 'enter')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [strength,  setStrength]  = useState(0)

  function calcStrength(val: string): number {
    let s = 0
    if (val.length >= 6)                         s++
    if (val.length >= 10)                        s++
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) s++
    if (/\d/.test(val))                          s++
    if (/[^A-Za-z0-9]/.test(val))               s++
    return s
  }

  function handlePasswordChange(val: string) {
    setPassword(val)
    setStrength(calcStrength(val))
    setError('')
  }

  async function handleEnter() {
    if (!password) return
    setLoading(true)
    setError('')
    const ok = await verifyPassword(password, pinHash)
    if (ok) {
      onUnlock()
    } else {
      setError('Contraseña incorrecta')
      setPassword('')
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (password.length < 4) { setError('Mínimo 4 caracteres'); return }
    setStep('confirm')
    setError('')
  }

  async function handleConfirm() {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      setConfirm('')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const hash = await hashPassword(password)
    await supabase.from('diary_settings').upsert({ user_id: user.id, pin_hash: hash })
    onUnlock()
    setLoading(false)
  }

  const strengthColors = ['#374151', '#FF3860', '#FFB800', '#00F5FF', '#00FF88', '#B026FF']
  const strengthLabels = ['', 'Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 44px 12px 16px',
    background: '#0d1120', border: '1px solid #1F2937',
    borderRadius: '10px', color: '#F1F5F9',
    fontSize: '15px', outline: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
    letterSpacing: showPass ? 'normal' : '4px',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0E1A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        background: '#131829', border: '1px solid #1F2937',
        borderRadius: '20px', padding: '36px 28px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'lock-appear 0.4s ease',
      }}>
        <style>{`
          @keyframes lock-appear {
            from { opacity:0; transform:translateY(16px); }
            to   { opacity:1; transform:translateY(0); }
          }
        `}</style>

        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #B026FF15, #00F5FF15)',
          border: '1px solid #B026FF33',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 30px #B026FF22',
        }}>
          {step === 'create' || step === 'confirm'
            ? <Shield size={32} color="#B026FF" />
            : <Lock size={32} color="#00F5FF" />
          }
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F1F5F9', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {step === 'create'  ? 'Protege tu diario' :
           step === 'confirm' ? 'Confirma tu clave' :
           'Mi Diario Privado'}
        </h2>

        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 28px', lineHeight: 1.6 }}>
          {step === 'create'  ? 'Crea una clave alfanumérica segura. Puede ser una frase, palabras o combinación.' :
           step === 'confirm' ? 'Escribe la misma clave para confirmar.' :
           'Ingresa tu clave para acceder.'}
        </p>

        <div style={{ position: 'relative', marginBottom: step === 'create' ? '10px' : '16px' }}>
          <input
            type={showPass ? 'text' : 'password'}
            value={step === 'confirm' ? confirm : password}
            onChange={e => step === 'confirm' ? setConfirm(e.target.value) : handlePasswordChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (step === 'enter')   handleEnter()
                if (step === 'create')  handleCreate()
                if (step === 'confirm') handleConfirm()
              }
            }}
            placeholder={
              step === 'create'  ? 'Ej: MiDiario2025!' :
              step === 'confirm' ? 'Repite tu clave' :
              'Tu clave secreta'
            }
            autoFocus
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#00F5FF44'}
            onBlur={e => e.target.style.borderColor = '#1F2937'}
          />
          <button
            onClick={() => setShowPass(p => !p)}
            style={{
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#374151',
              cursor: 'pointer', display: 'flex', padding: '4px',
            }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* INDICADOR DE FUERZA */}
        {step === 'create' && password && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{
                  flex: 1, height: '3px', borderRadius: '3px',
                  background: i <= strength ? strengthColors[strength] : '#1F2937',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: strengthColors[strength], textAlign: 'left' }}>
              {strengthLabels[strength]}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 14px',
            background: '#FF386015', border: '1px solid #FF386033',
            borderRadius: '8px', fontSize: '13px', color: '#FF3860',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={step === 'enter' ? handleEnter : step === 'create' ? handleCreate : handleConfirm}
          disabled={loading || !(step === 'confirm' ? confirm : password)}
          style={{
            width: '100%', padding: '13px',
            background: step === 'enter' ? '#00F5FF' : '#B026FF',
            border: 'none', borderRadius: '10px',
            color: '#0A0E1A', fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            boxShadow: step === 'enter' ? '0 0 20px #00F5FF44' : '0 0 20px #B026FF44',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Verificando...' :
           step === 'enter'   ? '🔓 Entrar al diario' :
           step === 'create'  ? 'Continuar →' :
           '✓ Crear clave y entrar'}
        </button>

        {step === 'confirm' && (
          <button onClick={() => { setStep('create'); setConfirm(''); setError('') }} style={{
            marginTop: '12px', background: 'none', border: 'none',
            color: '#64748B', fontSize: '13px', cursor: 'pointer',
          }}>
            ← Cambiar clave
          </button>
        )}
      </div>
    </div>
  )
}