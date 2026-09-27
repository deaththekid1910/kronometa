'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}

// Ventana modal del Almacén: fondo oscuro, Esc o clic fuera para cerrar
export default function Modal({ title, subtitle, icon, color = 'var(--green)', onClose, children, maxWidth = 440 }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        // Por encima del aviso de instalación de la PWA (zIndex 9999)
        position: 'fixed', inset: 0, zIndex: 10001,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: `1px solid ${color}44`,
          borderRadius: 'var(--radius-xl)', padding: '22px',
          width: '100%', maxWidth: `${maxWidth}px`,
          boxShadow: `0 0 40px ${color}22`,
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            {icon && (
              <div style={{
                width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                background: `${color}15`, border: `1px solid ${color}33`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
              }}>
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{title}</h2>
              {subtitle && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '3px 0 0', lineHeight: 1.4 }}>{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" title="Cerrar (Esc)" style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', padding: '4px', display: 'flex', flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Estilos compartidos por los formularios del Almacén
export const fieldLabel: React.CSSProperties = {
  fontSize: '11px', color: 'var(--muted)', display: 'block',
  marginBottom: '6px', letterSpacing: '0.5px', fontWeight: 500,
}

export const fieldInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#1a1a2e', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', color: 'var(--text)',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
}
