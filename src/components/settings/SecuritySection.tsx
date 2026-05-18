'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Lock } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SecuritySection() {
  const [current,  setCurrent]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleChange() {
    setError('')
    if (newPass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPass !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    if (err) {
      setError('Error al cambiar la contraseña')
    } else {
      setSuccess(true)
      setCurrent('')
      setNewPass('')
      setConfirm('')
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition)',
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Lock size={15} color="var(--purple)" />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Seguridad</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            NUEVA CONTRASEÑA
          </label>
          <input
            type="password" value={newPass}
            onChange={e => setNewPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--purple)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            CONFIRMAR CONTRASEÑA
          </label>
          <input
            type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            onKeyDown={e => e.key === 'Enter' && handleChange()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--purple)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Indicador de fuerza */}
        {newPass.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {[1, 2, 3, 4].map(i => {
                const strength = newPass.length >= 12 ? 4 : newPass.length >= 8 ? 3 : newPass.length >= 6 ? 2 : 1
                const color = strength >= 3 ? 'var(--green)' : strength === 2 ? 'var(--amber)' : 'var(--red)'
                return (
                  <div key={i} style={{
                    flex: 1, height: '3px', borderRadius: '3px',
                    background: i <= strength ? color : 'var(--border)',
                    transition: 'background 0.3s',
                  }} />
                )
              })}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
              {newPass.length >= 12 ? 'Muy segura' : newPass.length >= 8 ? 'Segura' : newPass.length >= 6 ? 'Aceptable' : 'Muy corta'}
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: '#FF386015', border: '1px solid #FF386033', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#00FF8815', border: '1px solid #00FF8833', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', color: 'var(--green)' }}>
            ✓ Contraseña actualizada correctamente
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="md"
            loading={loading}
            onClick={handleChange}
            disabled={!newPass || !confirm}
            style={{ background: '#B026FF15', color: 'var(--purple)', borderColor: '#B026FF33' }}
          >
            Cambiar contraseña
          </Button>
        </div>
      </div>
    </div>
  )
}