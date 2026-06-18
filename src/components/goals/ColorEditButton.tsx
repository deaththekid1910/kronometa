'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import ColorPicker from '@/components/ui/ColorPicker'
import Button from '@/components/ui/Button'
import { Palette, X } from 'lucide-react'

interface Props {
  goalId: string
  color: string
  onSaved: (color: string) => void
}

// Botón + modal para cambiar el color de una meta o hábito ya creado.
export default function ColorEditButton({ goalId, color, onSaved }: Props) {
  const [open,       setOpen]       = useState(false)
  const [value,      setValue]      = useState(color)
  const [usedColors, setUsedColors] = useState<string[]>([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => { setValue(color) }, [color])

  async function openPicker() {
    setValue(color)
    setOpen(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('goals')
      .select('id, color')
      .eq('user_id', user.id)
      .eq('archived', false)
    setUsedColors((data || []).filter(g => g.id !== goalId).map(g => g.color).filter(Boolean))
  }

  async function save() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('goals').update({ color: value }).eq('id', goalId)
    onSaved(value)
    setLoading(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={openPicker}
        title="Cambiar color"
        style={{
          width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
          background: `${color}15`, border: `1px solid ${color}40`,
          color, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Palette size={15} />
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--surface)', border: `1px solid ${value}44`,
            borderRadius: 'var(--radius-xl)', padding: '24px',
            width: '100%', maxWidth: '420px', boxShadow: `0 0 40px ${value}18`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${value}15`, border: `1px solid ${value}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Palette size={16} color={value} />
                </div>
                <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Cambiar color</h2>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: 'var(--dim)',
                cursor: 'pointer', padding: '4px', display: 'flex',
              }}>
                <X size={18} />
              </button>
            </div>

            <ColorPicker value={value} onChange={setValue} usedColors={usedColors} />

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <Button variant="ghost" size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </Button>
              <Button
                variant="primary" size="md" loading={loading} onClick={save}
                style={{ flex: 2, background: value, color: '#0A0E1A', justifyContent: 'center' }}
              >
                Guardar color
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
