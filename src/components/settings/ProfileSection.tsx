'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { User } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  name: string
  email: string
  onUpdate: (name: string) => void
}

export default function ProfileSection({ name, email, onUpdate }: Props) {
  const [newName,  setNewName]  = useState(name)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  const initials = newName.trim().split(' ').length >= 2
    ? newName.trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : newName.slice(0, 2).toUpperCase()

  async function handleSave() {
    if (!newName.trim()) return
    setLoading(true)
    setError('')
    setSuccess(false)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({
      data: { full_name: newName.trim() }
    })
    if (err) {
      setError('Error al actualizar el nombre')
    } else {
      setSuccess(true)
      onUpdate(newName.trim())
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
        <User size={15} color="var(--cyan)" />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>Información del perfil</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--cyan), var(--purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', fontWeight: 700, color: '#0A0E1A',
          boxShadow: '0 0 20px #00F5FF33',
        }}>
          {initials || '..'}
        </div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{newName || '...'}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{email}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            NOMBRE COMPLETO
          </label>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="Tu nombre"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--cyan)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div>
          <label style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
            CORREO ELECTRÓNICO
          </label>
          <input
            value={email}
            disabled
            style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '11px', color: 'var(--dim)', marginTop: '4px' }}>
            El correo no se puede cambiar desde aquí
          </p>
        </div>

        {error && (
          <div style={{ background: '#FF386015', border: '1px solid #FF386033', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#00FF8815', border: '1px solid #00FF8833', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '12px', color: 'var(--green)' }}>
            ✓ Nombre actualizado correctamente
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="primary"
            size="md"
            loading={loading}
            onClick={handleSave}
            disabled={newName.trim() === name || !newName.trim()}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}