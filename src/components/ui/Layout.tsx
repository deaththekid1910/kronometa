'use client'

import React from 'react'

// Piezas de maquetación compartidas por Diarias, Horario y Metas:
// cada sección en su propio panel, pestañas iguales en toda la app,
// indicadores arriba y botones de acción con espacio propio.

// ── Panel con cabecera (ícono, título, contador y acción opcional) ──────────
export function Panel({ icon, title, subtitle, color, count, action, isMobile, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  color: string
  count?: number
  action?: React.ReactNode
  isMobile: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px' : '18px', minWidth: 0,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color }}>
            {title}
            {count !== undefined && (
              <span style={{ marginLeft: '8px', color: 'var(--muted)', fontWeight: 500, letterSpacing: 0 }}>· {count}</span>
            )}
          </h2>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

// ── Botón pequeño "Agregar" para la cabecera de un panel ─────────────────────
export function PanelAction({ color, onClick, children }: { color: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      background: `${color}12`, border: `1px solid ${color}40`, color,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {children}
    </button>
  )
}

// ── Pestañas ─────────────────────────────────────────────────────────────────
export interface TabDef<T extends string> {
  id: T
  label: string
  icon: React.ReactNode
  color: string
  count?: number
}

export function TabBar<T extends string>({ tabs, active, onChange, isMobile }: {
  tabs: TabDef<T>[]
  active: T
  onChange: (id: T) => void
  isMobile: boolean
}) {
  return (
    <nav role="tablist" style={{
      display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', scrollbarWidth: 'none',
    }}>
      {tabs.map(t => {
        const on = t.id === active
        return (
          <button
            key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            style={{
              flex: isMobile ? '1 0 auto' : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: isMobile ? '8px 12px' : '9px 14px',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: '13px', fontWeight: on ? 600 : 500,
              color: on ? t.color : 'var(--muted)',
              background: on ? '#ffffff0a' : 'transparent',
              border: `1px solid ${on ? 'var(--border)' : 'transparent'}`,
              boxShadow: on ? `inset 0 -2px 0 ${t.color}` : 'none',
              transition: 'all var(--transition)',
            }}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{
                minWidth: '20px', padding: '1px 6px', borderRadius: '10px', boxSizing: 'border-box',
                fontSize: '11px', fontFamily: 'var(--font-mono)', textAlign: 'center',
                background: on ? '#ffffff14' : '#ffffff0d', color: on ? t.color : 'var(--muted)',
              }}>{t.count}</span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ── Indicadores en fila ──────────────────────────────────────────────────────
export interface StatDef {
  label: string
  value: React.ReactNode
  color: string
  hint?: string
  bar?: number          // 0-100: muestra una barra de progreso
}

export function StatRow({ stats, isMobile }: { stats: StatDef[]; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid', gap: isMobile ? '8px' : '10px',
      gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(${stats.length}, minmax(0, 1fr))`,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: isMobile ? '11px 12px' : '14px 16px', minWidth: 0,
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>{s.label}</div>
          <div style={{
            fontSize: isMobile ? '17px' : '20px', fontWeight: 600, fontFamily: 'var(--font-mono)',
            color: s.color, lineHeight: 1.25, overflowWrap: 'anywhere',
          }}>
            {s.value}
          </div>
          {s.hint && <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>{s.hint}</div>}
          {s.bar !== undefined && (
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
              <div style={{ height: '100%', width: `${s.bar}%`, background: s.color, transition: 'width 0.6s ease' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Cabecera de página (ícono + título + subtítulo + acción) ─────────────────
export function PageHeader({ icon, color, title, subtitle, action, isMobile }: {
  icon: React.ReactNode
  color: string
  title: string
  subtitle?: React.ReactNode
  action?: React.ReactNode
  isMobile: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, color,
          background: `${color}0D`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Contenedor de página ancho y responsive ──────────────────────────────────
export function PageShell({ isMobile, maxWidth = 1100, children }: { isMobile: boolean; maxWidth?: number; children: React.ReactNode }) {
  return (
    <div style={{
      maxWidth: `${maxWidth}px`, width: '100%', margin: '0 auto', boxSizing: 'border-box',
      padding: isMobile ? '12px' : '24px 20px',
      display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '18px',
    }}>
      {children}
    </div>
  )
}

// ── Estilos para las tarjetas de ítems (tareas, bloques, submetas) ───────────

// Etiqueta de dato (hora, fecha, racha...)
export function chip(c: string): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '11px', color: c,
    background: `${c}10`, border: `1px solid ${c}30`,
    padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap',
  }
}

// Botón de acción de 32px con su color: se distingue y se toca cómodo en móvil
export function actionBtn(c: string): React.CSSProperties {
  return {
    width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
    background: `${c}10`, border: `1px solid ${c}30`, color: c,
    cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all var(--transition)',
  }
}

// Pie de tarjeta: datos a la izquierda, acciones a la derecha
export function ItemFooter({ indent = 16, meta, actions }: { indent?: number; meta: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '10px', flexWrap: 'wrap',
      padding: `8px 12px 8px ${indent}px`,
      borderTop: '1px solid var(--border)',
      background: '#0A0E1A55',
      minHeight: '44px', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>{meta}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>{actions}</div>
    </div>
  )
}

// Confirmación en línea dentro del pie ("¿Eliminar? Sí / No")
export function InlineConfirm({ text, confirmLabel = 'Sí', loading, onConfirm, onCancel }: {
  text: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <span style={{ fontSize: '12px', color: 'var(--text)' }}>{text}</span>
      <button onClick={onConfirm} disabled={loading} style={{
        padding: '6px 14px', borderRadius: 'var(--radius-sm)',
        background: 'var(--red)', border: 'none',
        color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
      }}>
        {loading ? '...' : confirmLabel}
      </button>
      <button onClick={onCancel} style={{
        padding: '6px 14px', borderRadius: 'var(--radius-sm)',
        background: 'transparent', border: '1px solid var(--border)',
        color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
      }}>
        No
      </button>
    </>
  )
}

// Fondo oscuro para los modales existentes (por encima del aviso de instalación)
export function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(4px)', zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      {children}
    </div>
  )
}
