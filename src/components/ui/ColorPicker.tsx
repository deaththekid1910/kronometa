'use client'

import { Check, Pipette } from 'lucide-react'

// Paleta base de colores neón distintos. El usuario puede además elegir
// CUALQUIER color con la rueda en vivo (input type="color").
export const PRESET_COLORS = [
  '#00F5FF', '#B026FF', '#00FF88', '#FFB800', '#FF3860',
  '#60A5FA', '#F87171', '#34D399', '#A78BFA', '#FB7185',
  '#F59E0B', '#22D3EE', '#EC4899', '#10B981', '#8B5CF6', '#FACC15',
]

// Devuelve el primer color de la paleta que no esté ya en uso (para no repetir).
export function firstUnusedColor(used: string[]): string {
  const set = new Set(used.map(c => c.toLowerCase()))
  return PRESET_COLORS.find(c => !set.has(c.toLowerCase())) || PRESET_COLORS[0]
}

interface Props {
  value: string
  onChange: (color: string) => void
  usedColors?: string[]        // colores ya usados por otras metas/hábitos
}

export default function ColorPicker({ value, onChange, usedColors = [] }: Props) {
  const used = new Set(usedColors.map(c => c.toLowerCase()))
  const val  = (value || '').toLowerCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* PRESETS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {PRESET_COLORS.map(c => {
          const selected = val === c.toLowerCase()
          const isUsed   = used.has(c.toLowerCase()) && !selected
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              title={isUsed ? 'Ya usado por otra meta/hábito' : c}
              style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: c, cursor: 'pointer', position: 'relative',
                border: selected ? '2px solid #fff' : '2px solid transparent',
                transform: selected ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform 0.15s',
                opacity: isUsed ? 0.35 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: selected ? `0 0 10px ${c}aa` : 'none',
              }}
            >
              {selected && <Check size={15} color="#0A0E1A" strokeWidth={3} />}
              {isUsed && (
                <span style={{
                  position: 'absolute', top: '-2px', right: '-2px',
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#0f0f1a', border: '1px solid #4b5563',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '8px', color: '#9ca3af', lineHeight: 1,
                }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* RUEDA EN VIVO + HEX */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', background: '#0d1120',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      }}>
        {/* PALETA EN VIVO (abre el selector nativo del sistema) */}
        <label style={{
          position: 'relative', width: '38px', height: '38px', flexShrink: 0,
          borderRadius: '10px', cursor: 'pointer', overflow: 'hidden',
          border: '2px solid #ffffff22',
          background: 'conic-gradient(from 0deg, #FF3860, #FFB800, #00FF88, #00F5FF, #B026FF, #FF3860)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Pipette size={15} color="#fff" style={{ filter: 'drop-shadow(0 0 2px #000)' }} />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
              position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer',
              width: '100%', height: '100%', border: 'none', padding: 0,
            }}
          />
        </label>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
            Color personalizado
          </div>
          <input
            type="text"
            value={value}
            onChange={e => {
              let v = e.target.value
              if (v && !v.startsWith('#')) v = '#' + v
              onChange(v.slice(0, 7))
            }}
            placeholder="#00F5FF"
            spellCheck={false}
            style={{
              width: '100%', maxWidth: '120px', padding: '5px 10px',
              background: '#1a1a2e', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: value,
              fontSize: '13px', fontWeight: 600, outline: 'none',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
              textTransform: 'uppercase', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* PREVIEW */}
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
          background: value, border: '2px solid #ffffff22',
          boxShadow: `0 0 12px ${value}66`,
        }} />
      </div>
    </div>
  )
}
