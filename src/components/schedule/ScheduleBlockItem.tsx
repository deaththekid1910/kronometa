'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ScheduleBlock } from '@/types/schedule'
import { formatDays, blockStatus, BlockStatus } from '@/lib/schedule'
import { Clock, Pencil, Trash2, Bell, BellOff, CalendarClock, Pause, Play } from 'lucide-react'
import EditScheduleBlockModal from './EditScheduleBlockModal'
import { ItemFooter, InlineConfirm, chip, actionBtn, ModalBackdrop } from '@/components/ui/Layout'

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
        borderRadius: 'var(--radius-md)', overflow: 'hidden',
        background: status === 'now' ? `${color}10` : 'var(--surface2)',
        border: `1px solid ${status === 'now' ? color + '55' : 'var(--border)'}`,
        boxShadow: status === 'now' ? `0 0 16px ${color}22` : 'none',
        opacity: dimmed ? 0.6 : 1,
        transition: 'all 0.3s ease',
      }}>
        {/* CUERPO: hora + barra de color + título */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px', padding: '14px 16px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0, minWidth: '50px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: dimmed ? 'var(--muted)' : color }}>
              {block.start_time.slice(0, 5)}
            </span>
            {block.end_time && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {block.end_time.slice(0, 5)}
              </span>
            )}
          </div>

          <div style={{ width: '3px', borderRadius: '3px', background: color, flexShrink: 0, opacity: dimmed ? 0.5 : 1 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '14px', fontWeight: 500,
                color: dimmed ? 'var(--muted)' : 'var(--text)',
                lineHeight: 1.4, overflowWrap: 'anywhere',
              }}>
                {block.title}
              </span>
              {statusUI && (
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                  color: statusUI.color, background: `${statusUI.color}15`,
                  border: `1px solid ${statusUI.color}33`,
                  padding: '2px 8px', borderRadius: '20px',
                }}>
                  {statusUI.label}
                </span>
              )}
              {!block.active && (
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                  color: 'var(--muted)', background: '#ffffff08',
                  border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '20px',
                }}>
                  PAUSADO
                </span>
              )}
            </div>
            {block.description && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {block.description}
              </p>
            )}
          </div>
        </div>

        {/* PIE: días, duración y alarma · acciones */}
        <ItemFooter
          meta={<>
            <span style={chip('#94A3B8')}>
              <CalendarClock size={11} />
              {formatDays(block.days_of_week)}
            </span>
            {block.end_time && (
              <span style={{ ...chip('#94A3B8'), fontFamily: 'var(--font-mono)' }}>
                <Clock size={11} />
                {block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}
              </span>
            )}
            <span style={chip(block.notify ? color : '#94A3B8')}>
              {block.notify ? <Bell size={11} /> : <BellOff size={11} />}
              {block.notify ? 'Alarma' : 'Sin alarma'}
            </span>
          </>}
          actions={confirmDel ? (
            <InlineConfirm text="¿Eliminar?" confirmLabel="Sí, eliminar" loading={loading}
              onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />
          ) : (<>
            <button onClick={toggleActive} disabled={loading}
              title={block.active ? 'Pausar bloque' : 'Reanudar bloque'}
              aria-label={block.active ? 'Pausar bloque' : 'Reanudar bloque'}
              style={actionBtn(block.active ? '#FFB800' : '#00FF88')}>
              {block.active ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button onClick={() => setShowEdit(true)} title="Editar" aria-label="Editar bloque" style={actionBtn(color)}>
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirmDel(true)} title="Eliminar" aria-label="Eliminar bloque" style={actionBtn('#FF3860')}>
              <Trash2 size={13} />
            </button>
          </>)}
        />
      </div>

      {showEdit && (
        <ModalBackdrop>
          <EditScheduleBlockModal
            block={block}
            color={color}
            onSave={updated => { onUpdate(updated); setShowEdit(false) }}
            onClose={() => setShowEdit(false)}
          />
        </ModalBackdrop>
      )}
    </>
  )
}
