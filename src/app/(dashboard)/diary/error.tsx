'use client'

import { useEffect } from 'react'

export default function DiaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Diary Error]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: '16px',
      fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px',
    }}>
      <div style={{ fontSize: '40px' }}>📓</div>
      <div style={{ fontSize: '16px', fontWeight: 600, color: '#F1F5F9' }}>
        Error al cargar el diario
      </div>
      <div style={{ fontSize: '13px', color: '#64748B', maxWidth: '360px' }}>
        {error.message || 'Ocurrió un problema inesperado.'}
      </div>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', borderRadius: '8px',
          background: '#B026FF', border: 'none',
          color: '#fff', fontSize: '13px', fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 0 16px #B026FF44',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}
