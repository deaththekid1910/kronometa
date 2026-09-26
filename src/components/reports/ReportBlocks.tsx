'use client'

import React from 'react'

// Bloques de maquetación compartidos por todas las secciones de Reportes.

export interface Kpi {
  label: string
  value: React.ReactNode
  hint?: string
  color: string
}

export function KpiGrid({ items, isMobile }: { items: Kpi[]; isMobile: boolean }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : `repeat(${items.length}, minmax(0, 1fr))`,
      gap: isMobile ? '8px' : '10px',
      marginBottom: isMobile ? '12px' : '16px',
    }}>
      {items.map(k => (
        <div key={k.label} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: isMobile ? '11px 12px' : '14px 16px',
          minWidth: 0,
        }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>{k.label}</div>
          <div style={{
            fontSize: isMobile ? '15px' : '18px', fontWeight: 600,
            fontFamily: 'var(--font-mono)', color: k.color,
            lineHeight: 1.3, overflowWrap: 'anywhere',
          }}>
            {k.value}
          </div>
          {k.hint && (
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {k.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

interface PanelProps {
  title: string
  subtitle?: string
  icon: React.ReactNode
  color: string
  isMobile: boolean
  wide?: boolean
  children: React.ReactNode
}

export function ReportPanel({ title, subtitle, icon, color, isMobile, wide, children }: PanelProps) {
  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: isMobile ? '14px' : '20px',
      minWidth: 0,
      gridColumn: wide ? '1 / -1' : undefined,
    }}>
      <header style={{ marginBottom: isMobile ? '12px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color, display: 'flex', flexShrink: 0 }}>{icon}</span>
          <h3 style={{
            margin: 0, fontSize: isMobile ? '11px' : '12px',
            color: 'var(--text)', letterSpacing: '0.8px', fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {title}
          </h3>
        </div>
        {subtitle && (
          <p style={{ margin: '4px 0 0 21px', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

export function PanelGrid({ isMobile, children }: { isMobile: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
      gap: isMobile ? '10px' : '16px',
    }}>
      {children}
    </div>
  )
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)', fontSize: '13px',
      border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

// Minutos → "3h 20m" / "45m"
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}
