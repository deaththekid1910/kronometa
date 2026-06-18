'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ScheduleBlock } from '@/types/schedule'
import { DAY_INITIAL, WEEK_ORDER } from '@/lib/schedule'
import { X, Pencil, Clock, Bell } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Props {
  block: ScheduleBlock
  color: string
  onSave: (block: ScheduleBlock) => void
  onClose: () => void
}

const PALETTE = ['#B026FF', '#00F5FF', '#00FF88', '#FFB800', '#FF3860']

export default function EditScheduleBlockModal({ block, color, onSave, onClose }: Props) {
  const [title,       setTitle]       = useState(block.title)
  const [description, setDescription] = useState(block.description || '')
  const [days,        setDays]        = useState<number[]>(block.days_of_week || [])
  const [startTime,   setStartTime]   = useState(block.start_time.slice(0, 5))
  const [endOn,       setEndOn]       = useState(!!block.end_time)
  const [endTime,     setEndTime]     = useState((block.end_time || '09:00').slice(0, 5))
  const [blockColor,  setBlockColor]  = useState(block.color || PALETTE[0])
  const [notify,      setNotify]      = useState(block.notify)
  const [loading,     setLoading]     = useState(false)

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleSave() {
    if (!title.trim() || days.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const patch = {
      title:        title.trim(),
      description:  description.trim() || null,
      days_of_week: [...days].sort((a, b) => a - b),
      start_time:   startTime,
      end_time:     endOn ? endTime : null,
      color:        blockColor,
      notify,
    }
    const { data } = await supabase
      .from('schedule_blocks')
      .update(patch)
      .eq('id', block.id)
      .select()
      .single()

    if (data) onSave(data)
    else onSave({ ...block, ...patch })
    setLoading(false)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text)',
    fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'var(--font-sans)', transition: 'border-color var(--transition)',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', color: 'var(--muted)',
    display: 'block', marginBottom: '6px', letterSpacing: '0.5px',
  }
  const timeInputStyle: React.CSSProperties = {
    padding: '6px 12px',
    background: '#1a1a2e', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: blockColor,
    fontSize: '14px', fontWeight: 600, outline: 'none',
    colorScheme: 'dark', fontFamily: 'var(--font-mono)',
    cursor: 'pointer', minWidth: '110px',
  }

  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${color}44`,
      borderRadius: 'var(--radius-xl)', padding: '24px',
      width: '100%', maxWidth: '460px',
      boxShadow: `0 0 40px ${color}18`,
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: color + '15', border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pencil size={15} color={color} />
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Editar bloque</h2>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--dim)',
          cursor: 'pointer', padding: '4px', display: 'flex',
        }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* TÍTULO */}
        <div>
          <label style={labelStyle}>OBLIGACIÓN *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSave()}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = blockColor}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* DÍAS */}
        <div>
          <label style={labelStyle}>DÍAS DE LA SEMANA *</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {WEEK_ORDER.map(d => {
              const on = days.includes(d)
              return (
                <button key={d} onClick={() => toggleDay(d)} style={{
                  flex: 1, height: '38px', borderRadius: 'var(--radius-sm)',
                  background: on ? blockColor : '#1a1a2e',
                  border: `1px solid ${on ? blockColor : 'var(--border)'}`,
                  color: on ? '#0A0E1A' : 'var(--muted)',
                  fontSize: '13px', fontWeight: on ? 700 : 500,
                  cursor: 'pointer', transition: 'all var(--transition)',
                  boxShadow: on ? `0 0 10px ${blockColor}55` : 'none',
                }}>
                  {DAY_INITIAL[d]}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={() => setDays([1, 2, 3, 4, 5])} style={quickDayBtn}>Lun a Vie</button>
            <button onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])} style={quickDayBtn}>Todos</button>
            <button onClick={() => setDays([0, 6])} style={quickDayBtn}>Fin de semana</button>
          </div>
        </div>

        {/* HORARIO */}
        <div style={{
          background: '#0d1120', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={14} color={blockColor} />
            <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>Hora de inicio</span>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              style={timeInputStyle}
              onFocus={e => e.target.style.borderColor = blockColor}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>Hora de fin</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Opcional, define la duración</div>
            </div>
            <Toggle on={endOn} color={blockColor} onClick={() => setEndOn(v => !v)} />
          </div>
          {endOn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={14} color={blockColor} />
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>Termina a las</span>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                style={timeInputStyle}
                onFocus={e => e.target.style.borderColor = blockColor}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN */}
        <div>
          <label style={labelStyle}>NOTA (opcional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = blockColor}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* COLOR */}
        <div>
          <label style={labelStyle}>COLOR</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PALETTE.map(c => (
              <button key={c} onClick={() => setBlockColor(c)} style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: c, cursor: 'pointer',
                border: blockColor === c ? '2px solid #fff' : '2px solid transparent',
                boxShadow: blockColor === c ? `0 0 10px ${c}88` : 'none',
                transition: 'all var(--transition)',
              }} />
            ))}
          </div>
        </div>

        {/* NOTIFICAR */}
        <div style={{
          background: '#0d1120', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Bell size={14} color={notify ? blockColor : 'var(--dim)'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>Alarma con sonido</div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Te avisa al llegar la hora de inicio</div>
          </div>
          <Toggle on={notify} color={blockColor} onClick={() => setNotify(v => !v)} />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <Button variant="ghost" size="md" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </Button>
          <Button
            variant="primary" size="md"
            loading={loading}
            onClick={handleSave}
            disabled={!title.trim() || days.length === 0}
            style={{ flex: 2, background: blockColor, color: '#0A0E1A', justifyContent: 'center' }}
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  )
}

const quickDayBtn: React.CSSProperties = {
  flex: 1, padding: '5px 4px', borderRadius: '6px',
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
  transition: 'all var(--transition)',
}

function Toggle({ on, color, onClick }: { on: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '44px', height: '24px', borderRadius: '12px',
      background: on ? color : 'var(--border)',
      border: 'none', cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
      boxShadow: on ? `0 0 10px ${color}66` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}
