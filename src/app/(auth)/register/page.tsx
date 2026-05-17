'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        background: '#0f0f1a',
        border: '1px solid #7F77DD44',
        borderRadius: '16px'
      }}>
        <h1 style={{ color: '#a78bfa', fontSize: '28px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
          KronoMeta
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '2rem' }}>
          Crea tu cuenta y empieza a crecer
        </p>

        {error && (
          <div style={{ background: '#ff000022', border: '1px solid #ff000055', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '13px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Nombre</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            style={{
              width: '100%', padding: '10px 14px', background: '#1a1a2e',
              border: '1px solid #7F77DD44', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Correo</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={{
              width: '100%', padding: '10px 14px', background: '#1a1a2e',
              border: '1px solid #7F77DD44', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{
              width: '100%', padding: '10px 14px', background: '#1a1a2e',
              border: '1px solid #7F77DD44', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '14px', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: '#7F77DD',
            border: 'none', borderRadius: '8px', color: '#fff',
            fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s'
          }}
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', marginTop: '1.5rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}