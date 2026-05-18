'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2 } from 'lucide-react'

export default function DangerSection() {
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (confirm !== 'ELIMINAR') return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('goals').update({ archived: true }).eq('user_id', user.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid #FF386033',
      borderRadius: 'var(--radius-lg)', padding: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <AlertTriangle size={15} color="var(--red)" />
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--red)' }}>Zona de peligro</span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.6 }}>
        Estas acciones son irreversibles. Por favor asegúrate antes de continuar.
      </p>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: 'var(--radius-sm)',
            background: '#FF386015', border: '1px solid #FF386044',
            color: 'var(--red)', fontSize: '13px', cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
        >
          <Trash2 size={14} />
          Archivar toda mi data
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: '#FF386010', border: '1px solid #FF386033',
            borderRadius: 'var(--radius-sm)', padding: '12px 14px',
            fontSize: '12px', color: 'var(--red)', lineHeight: 1.6,
          }}>
            ⚠️ Esto archivará todas tus metas, hábitos y cerrará tu sesión. Escribe <strong>ELIMINAR</strong> para confirmar.
          </div>

          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder='Escribe "ELIMINAR"'
            style={{
              width: '100%', padding: '10px 14px',
              background: '#1a1a2e', border: '1px solid #FF386033',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-sans)',
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setShowForm(false); setConfirm('') }} style={{
              flex: 1, padding: '10px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)', fontSize: '13px', cursor: 'pointer',
            }}>
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={confirm !== 'ELIMINAR' || loading}
              style={{
                flex: 1, padding: '10px', background: confirm === 'ELIMINAR' ? 'var(--red)' : '#FF386033',
                border: 'none', borderRadius: 'var(--radius-sm)',
                color: confirm === 'ELIMINAR' ? '#fff' : 'var(--dim)',
                fontSize: '13px', cursor: confirm === 'ELIMINAR' ? 'pointer' : 'not-allowed',
                transition: 'all var(--transition)',
              }}
            >
              {loading ? 'Procesando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}