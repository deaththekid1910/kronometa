'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ScheduleBlock } from '@/types/schedule'
import {
  DAY_NAMES, WEEK_ORDER, localDayOfWeek, sortByStart, blockStatus, timeToMinutes, nowMinutes,
} from '@/lib/schedule'
import ScheduleBlockItem from '@/components/schedule/ScheduleBlockItem'
import AddScheduleBlockModal from '@/components/schedule/AddScheduleBlockModal'
import Button from '@/components/ui/Button'
import { Panel, PanelAction, TabBar, StatRow, PageHeader, PageShell, ModalBackdrop } from '@/components/ui/Layout'
import { CalendarClock, Plus, Sun, CalendarDays, Radio, PauseCircle } from 'lucide-react'

const ACCENT = '#B026FF'

type View = 'today' | 'week'
const VIEW_KEY = 'kronometa.schedule.view'

// Duración de un bloque en minutos (sin hora de fin = 1 hora, como en alarmas)
function blockMinutes(b: ScheduleBlock): number {
  const start = timeToMinutes(b.start_time)
  let end = b.end_time ? timeToMinutes(b.end_time) : start + 60
  if (end <= start) end += 24 * 60
  return end - start
}

function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

export default function SchedulePage() {
  const [blocks,   setBlocks]   = useState<ScheduleBlock[]>([])
  const [userId,   setUserId]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState<View>('today')
  const [showAdd,  setShowAdd]  = useState(false)
  const [addDay,   setAddDay]   = useState<number | undefined>(undefined)

  const today    = localDayOfWeek()
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === 'today' || saved === 'week') setView(saved)
    } catch {}
    loadBlocks()
  }, [])

  function selectView(v: View) {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch {}
  }

  async function loadBlocks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
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

  const todayAll      = blocksForDay(today)
  const todayBlocks   = todayAll.filter(b => b.active)
  const todayPaused   = todayAll.filter(b => !b.active)
  const nowBlock      = todayBlocks.find(b => blockStatus(b) === 'now')
  const nextBlock     = todayBlocks.find(b => blockStatus(b) === 'upcoming')
  const todayUpcoming = todayBlocks.filter(b => blockStatus(b) !== 'past').length
  const todayMinutes  = todayBlocks.reduce((a, b) => a + blockMinutes(b), 0)
  const minsToNext    = nextBlock ? timeToMinutes(nextBlock.start_time) - nowMinutes() : 0

  const itemProps = { onUpdate: handleUpdate, onDelete: handleDelete }

  return (
    <PageShell isMobile={isMobile}>
      <PageHeader
        icon={<CalendarClock size={18} />} color={ACCENT} title="Horario"
        subtitle="Tus obligaciones recurrentes con alarmas" isMobile={isMobile}
        action={
          <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => openAdd(view === 'today' ? today : undefined)}
            style={{ background: ACCENT, color: '#0A0E1A', flexShrink: 0 }}>
            Nuevo bloque
          </Button>
        }
      />

      <StatRow isMobile={isMobile} stats={[
        { label: 'Bloques hoy',        value: todayBlocks.length,        color: ACCENT },
        { label: 'Por venir',          value: todayUpcoming,             color: 'var(--cyan)' },
        { label: 'Ahora',              value: nowBlock ? nowBlock.start_time.slice(0, 5) : '—', hint: nowBlock?.title || 'Nada en curso', color: 'var(--green)' },
        { label: 'Planificado hoy',    value: fmtMinutes(todayMinutes),  color: 'var(--amber)' },
      ]} />

      <TabBar<View>
        isMobile={isMobile} active={view} onChange={selectView}
        tabs={[
          { id: 'today', label: `Hoy · ${DAY_NAMES[today]}`, icon: <Sun size={14} />,          color: ACCENT, count: todayBlocks.length },
          { id: 'week',  label: 'Semana',                   icon: <CalendarDays size={14} />, color: 'var(--cyan)', count: blocks.length },
        ]}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : view === 'today' ? (
        /* ── VISTA HOY: agenda + panel de "ahora y próximo" ── */
        <div style={{
          display: 'grid', alignItems: 'start', gap: isMobile ? '12px' : '16px',
          gridTemplateColumns: isDesktop ? 'minmax(0, 1.6fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
        }}>
          <Panel icon={<Sun size={14} />} title="Agenda de hoy" color={ACCENT} count={todayBlocks.length} isMobile={isMobile}
            action={<PanelAction color={ACCENT} onClick={() => openAdd(today)}><Plus size={12} /> Agregar</PanelAction>}>
            {todayBlocks.length === 0 ? (
              <EmptyState onAdd={() => openAdd(today)} text="No tienes nada programado para hoy" />
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {todayBlocks.map(b => <ScheduleBlockItem key={b.id} block={b} showStatus {...itemProps} />)}
              </div>
            )}
          </Panel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', minWidth: 0 }}>
            <Panel icon={<Radio size={14} />} title="En este momento" color="var(--green)" isMobile={isMobile}>
              <NowCard label="Ahora" block={nowBlock} empty="Nada en curso" color="#00FF88" />
              <div style={{ height: '10px' }} />
              <NowCard
                label={nextBlock ? `Próximo · en ${fmtMinutes(Math.max(0, minsToNext))}` : 'Próximo'}
                block={nextBlock} empty="No quedan bloques hoy" color="#00F5FF"
              />
            </Panel>

            {todayPaused.length > 0 && (
              <Panel icon={<PauseCircle size={14} />} title="Pausados" subtitle="No suenan hasta que los reanudes"
                color="var(--muted)" count={todayPaused.length} isMobile={isMobile}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {todayPaused.map(b => <ScheduleBlockItem key={b.id} block={b} {...itemProps} />)}
                </div>
              </Panel>
            )}
          </div>
        </div>
      ) : (
        /* ── VISTA SEMANA: un panel por día ── */
        <div style={{
          display: 'grid', alignItems: 'start', gap: isMobile ? '12px' : '16px',
          gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(340px, 1fr))',
        }}>
          {WEEK_ORDER.map(day => {
            const dayBlocks = blocksForDay(day)
            const isToday   = day === today
            const mins      = dayBlocks.filter(b => b.active).reduce((a, b) => a + blockMinutes(b), 0)
            return (
              <div key={day} style={{ borderRadius: 'var(--radius-lg)', boxShadow: isToday ? `0 0 0 1px ${ACCENT}66` : 'none' }}>
                <Panel
                  icon={isToday ? <Sun size={14} /> : <CalendarDays size={14} />}
                  title={isToday ? `${DAY_NAMES[day]} · hoy` : DAY_NAMES[day]}
                  subtitle={dayBlocks.length > 0 ? `${fmtMinutes(mins)} planificadas` : undefined}
                  color={isToday ? ACCENT : 'var(--muted)'} count={dayBlocks.length} isMobile={isMobile}
                  action={<PanelAction color={ACCENT} onClick={() => openAdd(day)}><Plus size={12} /> Agregar</PanelAction>}
                >
                  {dayBlocks.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', margin: 0, padding: '6px 2px' }}>
                      Sin bloques este día
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {dayBlocks.map(b => (
                        <ScheduleBlockItem key={`${day}-${b.id}`} block={b} showStatus={isToday} {...itemProps} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL AGREGAR */}
      {showAdd && (
        <ModalBackdrop>
          <AddScheduleBlockModal
            userId={userId}
            color={ACCENT}
            defaultDay={addDay}
            onAdd={handleAdd}
            onClose={() => setShowAdd(false)}
          />
        </ModalBackdrop>
      )}
    </PageShell>
  )
}

// Tarjeta compacta del bloque en curso / siguiente
function NowCard({ label, block, empty, color }: { label: string; block?: ScheduleBlock; empty: string; color: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--radius-md)',
      background: block ? `${color}0D` : '#ffffff05',
      border: `1px solid ${block ? color + '40' : 'var(--border)'}`,
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', color: block ? color : 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
        {label}
      </div>
      {block ? (
        <>
          <div style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' }}>{block.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {block.start_time.slice(0, 5)}{block.end_time ? ` – ${block.end_time.slice(0, 5)}` : ''}
          </div>
        </>
      ) : (
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{empty}</div>
      )}
    </div>
  )
}

function EmptyState({ onAdd, text }: { onAdd: () => void; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <CalendarClock size={30} color={ACCENT} style={{ opacity: 0.4, marginBottom: '10px' }} />
      <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 14px' }}>{text}</p>
      <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={onAdd}
        style={{ background: `${ACCENT}12`, color: ACCENT, borderColor: `${ACCENT}30` }}>
        Agregar bloque
      </Button>
    </div>
  )
}
