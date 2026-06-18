'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ScheduleBlock } from '@/types/schedule'
import {
  DAY_NAMES, WEEK_ORDER, localDayOfWeek, sortByStart, blockStatus,
} from '@/lib/schedule'
import ScheduleBlockItem from '@/components/schedule/ScheduleBlockItem'
import AddScheduleBlockModal from '@/components/schedule/AddScheduleBlockModal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { CalendarClock, Plus, Sun, CalendarDays } from 'lucide-react'

const ACCENT = '#B026FF'

type View = 'today' | 'week'

export default function SchedulePage() {
  const [blocks,   setBlocks]   = useState<ScheduleBlock[]>([])
  const [userId,   setUserId]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState<View>('today')
  const [showAdd,  setShowAdd]  = useState(false)
  const [addDay,   setAddDay]   = useState<number | undefined>(undefined)

  const today = localDayOfWeek()

  useEffect(() => { loadBlocks() }, [])

  async function loadBlocks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true })

    if (data) setBlocks(data)
    setLoading(false)
  }

  // ── Handlers ──
  function handleAdd(b: ScheduleBlock)    { setBlocks(prev => [...prev, b]) }
  function handleUpdate(b: ScheduleBlock) { setBlocks(prev => prev.map(x => x.id === b.id ? b : x)) }
  function handleDelete(id: string)       { setBlocks(prev => prev.filter(x => x.id !== id)) }

  function openAdd(day?: number) {
    setAddDay(day)
    setShowAdd(true)
  }

  // ── Derivados ──
  const blocksForDay = (day: number) =>
    sortByStart(blocks.filter(b => b.days_of_week?.includes(day)))

  const todayBlocks  = blocksForDay(today).filter(b => b.active)
  const todayUpcoming = todayBlocks.filter(b => blockStatus(b) !== 'past').length

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `${ACCENT}0D`, border: `1px solid ${ACCENT}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <CalendarClock size={18} color={ACCENT} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Horario</h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Tus obligaciones recurrentes con alarmas
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => openAdd(view === 'today' ? today : undefined)}
          style={{ background: ACCENT, color: '#0A0E1A', flexShrink: 0 }}>
          Nuevo bloque
        </Button>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {([
          { key: 'today', label: 'Hoy',   icon: Sun },
          { key: 'week',  label: 'Semana', icon: CalendarDays },
        ] as const).map(({ key, label, icon: Icon }) => {
          const active = view === key
          return (
            <button key={key} onClick={() => setView(key)} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 16px', borderRadius: 'var(--radius-sm)',
              background: active ? `${ACCENT}15` : 'transparent',
              border: `1px solid ${active ? ACCENT + '44' : 'var(--border)'}`,
              color: active ? ACCENT : 'var(--muted)',
              fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer',
              transition: 'all var(--transition)',
            }}>
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : view === 'today' ? (
        /* ── VISTA HOY ── */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sun size={14} color={ACCENT} />
            <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 600 }}>
              {DAY_NAMES[today].toUpperCase()}
            </span>
            <Badge color="purple">{todayUpcoming} por venir</Badge>
          </div>

          {todayBlocks.length === 0 ? (
            <EmptyState onAdd={() => openAdd(today)} text="No tienes nada programado para hoy" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todayBlocks.map(b => (
                <ScheduleBlockItem key={b.id} block={b} showStatus onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── VISTA SEMANA ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {WEEK_ORDER.map(day => {
            const dayBlocks = blocksForDay(day)
            const isToday   = day === today
            return (
              <div key={day}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '11px', letterSpacing: '1px', fontWeight: 600,
                    color: isToday ? ACCENT : 'var(--muted)',
                  }}>
                    {DAY_NAMES[day].toUpperCase()}
                  </span>
                  {isToday && <Badge color="purple">HOY</Badge>}
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <button onClick={() => openAdd(day)} title={`Agregar a ${DAY_NAMES[day]}`} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--dim)', fontSize: '11px', padding: '3px 8px',
                    borderRadius: '6px', cursor: 'pointer', transition: 'all var(--transition)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.borderColor = `${ACCENT}44` }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--dim)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                    <Plus size={11} /> Agregar
                  </button>
                </div>

                {dayBlocks.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--dim)', fontStyle: 'italic', padding: '4px 2px' }}>
                    Sin bloques
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayBlocks.map(b => (
                      <ScheduleBlockItem key={`${day}-${b.id}`} block={b}
                        showStatus={isToday} onUpdate={handleUpdate} onDelete={handleDelete} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL AGREGAR */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <AddScheduleBlockModal
            userId={userId}
            color={ACCENT}
            defaultDay={addDay}
            onAdd={handleAdd}
            onClose={() => setShowAdd(false)}
          />
        </div>
      )}
    </div>
  )
}

function EmptyState({ onAdd, text }: { onAdd: () => void; text: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '2.5rem',
      background: 'var(--surface)',
      border: `1px dashed ${ACCENT}33`,
      borderRadius: 'var(--radius-lg)',
    }}>
      <CalendarClock size={30} color={ACCENT} style={{ opacity: 0.4, marginBottom: '10px' }} />
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '12px' }}>{text}</p>
      <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={onAdd}
        style={{ background: `${ACCENT}12`, color: ACCENT, borderColor: `${ACCENT}30` }}>
        Agregar bloque
      </Button>
    </div>
  )
}
