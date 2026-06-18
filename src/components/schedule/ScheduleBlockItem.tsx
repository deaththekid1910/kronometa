'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ScheduleBlock } from '@/types/schedule'
import { formatDays, blockStatus, BlockStatus } from '@/lib/schedule'
import { Clock, Pencil, Trash2, Bell, BellOff, CalendarClock } from 'lucide-react'
import EditScheduleBlockModal from './EditScheduleBlockModal'

interface Props {
  block: ScheduleBlock
  showStatus?: boolean         // resalta now/próximo (solo en la vista de "Hoy")
  onUpdate: (block: ScheduleBlock) => void
  onDelete: (id: string) => void
}

const STATUS_META: Record<BlockStatus, { label: string; color: string } | null> = {
  now:      { label: 'AHORA',   color: '#00FF88' },
  upcoming: { label: 'PRÓXIMO', color: '#00F5FF' },
  past:     null,
}

export default function ScheduleBlockItem({ block, showStatus, onUpdate, onDelete }: Props) {
  const [loading,    setLoading]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showEdit,   setShowEdit]   = useState(false)

  const color    = block.color || '#B026FF'
  const status   = showStatus ? blockStatus(block) : null
  const statusUI = status ? STATUS_META[status] : null
  const dimmed   = !block.active || status === 'past'

  async function toggleActive() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    const next = !block.active
    await supabase.from('schedule_blocks').update({ active: next }).eq('id', block.id)
    onUpdate({ ...block, active: next })
    setLoading(false)
  }

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('schedule_blocks').delete().eq('id', block.id)
    onDelete(block.id)
    setLoading(false)
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px', borderRadius: 'var(--radius-md)',
        background: status === 'now' ? `${color}10` : 'var(--surface)',
        border: `1px solid ${status === 'now' ? color + '55' : 'var(--border)'}`,
        boxShadow: status === 'now' ? `0 0 16px ${color}22` : 'none',
        opacity: dimmed ? 0.55 : 1,
        transition: 'all 0.3s ease',
      }}>
        {/* BARRA DE COLOR + HORA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '4px', flexShrink: 0, minWidth: '54px',
        }}>
          <span style={{
            fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: dimmed ? 'var(--muted)' : color,
          }}>
            {block.start_time.slice(0, 5)}
          </span>
          {block.end_time && (
            <span style={{ fontSize: '10px', color: 'var(--dim)', fontFamily: 'var(--font-mono)' }}>
              {block.end_time.slice(0, 5)}
            </span>
          )}
        </div>

        <div style={{ width: '3px', alignSelf: 'stretch', borderRadius: '3px', background: color, flexShrink: 0, opacity: dimmed ? 0.5 : 1 }} />

        {/* CONTENIDO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '14px', fontWeight: 500,
              color: dimmed ? 'var(--muted)' : 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {block.title}
            </span>
            {statusUI && (
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                color: statusUI.color, background: `${statusUI.color}15`,
                border: `1px solid ${statusUI.color}33`,
                padding: '1px 6px', borderRadius: '20px',
              }}>
                {statusUI.label}
              </span>
            )}
            {!block.active && (
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '1px',
                color: 'var(--dim)', background: '#ffffff08',
                border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '20px',
              }}>
                PAUSADO
              </span>
            )}
          </div>

          {block.description && (
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0', lineHeight: 1.5 }}>
              {block.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: 'var(--muted)',
              background: '#ffffff06', border: '1px solid var(--border)',
              padding: '1px 8px', borderRadius: '20px',
            }}>
              <CalendarClock size={11} />
              {formatDays(block.days_of_week)}
            </span>
            {block.end_time && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--dim)',
              }}>
                <Clock size={11} />
                {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
              </span>
            )}
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', color: block.notify ? color : 'var(--dim)',
            }}>
              {block.notify ? <Bell size={11} /> : <BellOff size={11} />}
              {block.notify ? 'Alarma' : 'Sin alarma'}
            </span>
          </div>

          {/* CONFIRM ELIMINAR */}
          {confirmDel && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px',
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: '#FF386010', border: '1px solid #FF386030', flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                ¿Eliminar este bloque del horario?
              </span>
              <button onClick={handleDelete} disabled={loading} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'var(--red)', border: 'none',
                color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
              }}>
                {loading ? '...' : 'Sí'}
              </button>
              <button onClick={() => setConfirmDel(false)} style={{
                padding: '4px 10px', borderRadius: '6px',
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
              }}>
                No
              </button>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        {!confirmDel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={toggleActive}
              disabled={loading}
              title={block.active ? 'Pausar' : 'Activar'}
              style={iconBtn}
              onMouseEnter={e => hoverIcon(e, block.active ? '#FFB800' : '#00FF88')}
              onMouseLeave={resetIcon}
            >
              {block.active ? <BellOff size={12} /> : <Bell size={12} />}
            </button>
            <button onClick={() => setShowEdit(true)} title="Editar" style={iconBtn}
              onMouseEnter={e => hoverIcon(e, color)} onMouseLeave={resetIcon}>
              <Pencil size={12} />
            </button>
            <button onClick={() => setConfirmDel(true)} title="Eliminar" style={iconBtn}
              onMouseEnter={e => hoverIcon(e, '#FF3860')} onMouseLeave={resetIcon}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditScheduleBlockModal
            block={block}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </div>
      )}
    </>
  )
}

const iconBtn: React.CSSProperties = {
  width: '26px', height: '26px', borderRadius: '6px',
  background: 'transparent', border: '1px solid transparent',
  color: 'var(--dim)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all var(--transition)',
}

function hoverIcon(e: React.MouseEvent<HTMLButtonElement>, c: string) {
  e.currentTarget.style.background = `${c}15`
  e.currentTarget.style.borderColor = `${c}33`
  e.currentTarget.style.color = c
}

function resetIcon(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.background = 'transparent'
  e.currentTarget.style.borderColor = 'transparent'
  e.currentTarget.style.color = 'var(--dim)'
}
