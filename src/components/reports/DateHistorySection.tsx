'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getDailyHistory, getHistoryByDate, localDateOf, DayBreakdown, DateHistoryItem } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import { useTimerStore } from '@/store/timerStore'
import { CalendarSearch, Target, Repeat2, ChevronLeft, ChevronRight, Clock, Layers } from 'lucide-react'

const ACCENT     = '#FFB800'
const HISTORY    = 30          // días que se cargan de golpe
const STRIP_DAYS = 14          // días visibles en la tira de selección

function shiftDate(date: string, delta: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return localDateOf(d)
}

function longDate(date: string): string {
  return new Date(date + 'T12:00:00').toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function relativeLabel(date: string, today: string): string | null {
  if (date === today) return 'Hoy'
  if (date === shiftDate(today, -1)) return 'Ayer'
  return null
}

interface Props { isMobile: boolean }

export default function DateHistorySection({ isMobile }: Props) {
  const today = localDateOf(new Date())

  const [days,      setDays]      = useState<Record<string, DayBreakdown>>({})
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(today)
  const [fetchedAt, setFetchedAt] = useState(() => Date.now())
  const stripRef = useRef<HTMLDivElement>(null)

  // Sesiones activas globales: al iniciar/detener cualquier cronómetro se
  // recarga el historial, y mientras haya alguno corriendo el tiempo sube en
  // vivo sin volver a consultar la base de datos.
  const sessions           = useTimerStore(s => s.sessions)
  const now                = useTimerStore(s => s.now)
  const loadActiveSessions = useTimerStore(s => s.loadActiveSessions)
  const runningKey         = Object.keys(sessions).sort().join(',')

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const data = await getDailyHistory(user.id, HISTORY)
    setDays(prev => {
      const next: Record<string, DayBreakdown> = {}
      // Conserva los días antiguos consultados a mano
      for (const [k, v] of Object.entries(prev)) if (k < shiftDate(today, -(HISTORY - 1))) next[k] = v
      for (const d of data) next[d.date] = d
      return next
    })
    setFetchedAt(Date.now())
    setLoading(false)
  }

  async function loadSingle(date: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const items = await getHistoryByDate(user.id, date)
    setDays(prev => ({
      ...prev,
      [date]: { date, items, totalSeconds: items.reduce((a, i) => a + i.totalSeconds, 0) },
    }))
  }

  useEffect(() => { loadActiveSessions() }, [loadActiveSessions])

  useEffect(() => { load() }, [runningKey])

  useEffect(() => {
    const onFocus = () => { loadActiveSessions(true); load() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Días fuera del rango cargado (elegidos con el calendario) se piden aparte
  useEffect(() => {
    if (loading) return
    if (!days[selected] && selected < shiftDate(today, -(HISTORY - 1))) loadSingle(selected)
  }, [selected, loading])

  // Mantiene visible en la tira el día seleccionado
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>(`[data-date="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selected])

  // Segundos transcurridos desde la última consulta (para lo que está corriendo)
  const liveExtra = runningKey ? Math.max(0, Math.floor((now - fetchedAt) / 1000)) : 0
  const secsOf = (it: DateHistoryItem) => it.totalSeconds + (it.running ? liveExtra : 0)

  const strip = useMemo(() => {
    const out: { date: string; secs: number }[] = []
    for (let i = STRIP_DAYS - 1; i >= 0; i--) {
      const date = shiftDate(today, -i)
      const d = days[date]
      out.push({ date, secs: d ? d.items.reduce((a, it) => a + secsOf(it), 0) : 0 })
    }
    return out
  }, [days, today, liveExtra])
  const stripMax = Math.max(...strip.map(s => s.secs), 1)

  const day      = days[selected]
  const items    = day?.items || []
  const goals    = items.filter(i => i.type !== 'habit')
  const habits   = items.filter(i => i.type === 'habit')
  const dayTotal = items.reduce((a, i) => a + secsOf(i), 0)
  const goalSecs = goals.reduce((a, i) => a + secsOf(i), 0)
  const habitSecs = habits.reduce((a, i) => a + secsOf(i), 0)
  const sessionsCount = items.reduce((a, i) => a + i.sessions, 0)
  const rel = relativeLabel(selected, today)

  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: isMobile ? '14px' : '20px',
    }}>
      {/* CABECERA: título + navegación de fecha */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '14px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarSearch size={14} color={ACCENT} />
          <h3 style={{ margin: 0, fontSize: isMobile ? '11px' : '12px', color: 'var(--text)', letterSpacing: '0.8px', fontWeight: 600 }}>
            HISTORIAL DIARIO
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <NavButton onClick={() => setSelected(d => shiftDate(d, -1))} title="Día anterior">
            <ChevronLeft size={15} />
          </NavButton>
          <input
            type="date"
            value={selected}
            max={today}
            onChange={e => e.target.value && setSelected(e.target.value)}
            style={{
              padding: '6px 10px', background: '#1a1a2e',
              border: `1px solid ${ACCENT}40`, borderRadius: 'var(--radius-sm)',
              color: ACCENT, fontSize: '13px', fontWeight: 600, outline: 'none',
              colorScheme: 'dark', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}
          />
          <NavButton onClick={() => setSelected(d => shiftDate(d, 1))} disabled={selected >= today} title="Día siguiente">
            <ChevronRight size={15} />
          </NavButton>
          {selected !== today && (
            <button onClick={() => setSelected(today)} style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            }}>
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* TIRA DE LOS ÚLTIMOS 14 DÍAS */}
      <div ref={stripRef} style={{
        display: 'grid', gridAutoFlow: 'column',
        gridAutoColumns: isMobile ? '44px' : 'minmax(40px, 1fr)',
        gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px',
        scrollbarWidth: 'thin',
      }}>
        {strip.map(s => {
          const active = s.date === selected
          const d = new Date(s.date + 'T12:00:00')
          const wd = d.toLocaleDateString('es-VE', { weekday: 'short' }).replace('.', '').slice(0, 3)
          return (
            <button
              key={s.date}
              data-date={s.date}
              onClick={() => setSelected(s.date)}
              title={`${longDate(s.date)} · ${formatTime(s.secs)}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '8px 0 6px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                background: active ? `${ACCENT}14` : 'transparent',
                border: `1px solid ${active ? ACCENT + '66' : 'var(--border)'}`,
              }}
            >
              <div style={{ height: '36px', width: '8px', display: 'flex', alignItems: 'flex-end', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: '100%', height: `${s.secs > 0 ? Math.max(8, (s.secs / stripMax) * 100) : 0}%`,
                  background: active ? ACCENT : `${ACCENT}99`, borderRadius: '4px',
                  transition: 'height 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '10px', color: active ? ACCENT : 'var(--muted)', textTransform: 'capitalize' }}>{wd}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: active ? 'var(--text)' : 'var(--muted)' }}>
                {d.getDate()}
              </span>
            </button>
          )
        })}
      </div>

      {/* RESUMEN DEL DÍA SELECCIONADO */}
      <div style={{
        display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px', padding: isMobile ? '12px' : '14px 16px',
        background: '#ffffff05', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize', lineHeight: 1.3 }}>
            {rel ? `${rel} · ` : ''}{longDate(selected)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>
            {items.length} {items.length === 1 ? 'actividad' : 'actividades'} · {sessionsCount} {sessionsCount === 1 ? 'sesión' : 'sesiones'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Clock size={16} color={ACCENT} />
          <span style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: ACCENT }}>
            {formatTime(dayTotal)}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem 1rem', lineHeight: 1.5,
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
          color: 'var(--muted)', fontSize: '13px',
        }}>
          No registraste tiempo en metas ni hábitos este día.
        </div>
      ) : (
        <>
          {/* REPARTO METAS / HÁBITOS */}
          {goals.length > 0 && habits.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', height: '8px', borderRadius: '6px', overflow: 'hidden', background: 'var(--border)' }}>
                <div style={{ width: `${(goalSecs / (dayTotal || 1)) * 100}%`, background: 'var(--cyan)' }} />
                <div style={{ width: `${(habitSecs / (dayTotal || 1)) * 100}%`, background: 'var(--green)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', gap: '8px' }}>
                <span style={{ color: 'var(--cyan)' }}>Metas {Math.round((goalSecs / (dayTotal || 1)) * 100)}%</span>
                <span style={{ color: 'var(--green)' }}>Hábitos {Math.round((habitSecs / (dayTotal || 1)) * 100)}%</span>
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile || goals.length === 0 || habits.length === 0 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
            gap: isMobile ? '18px' : '24px',
          }}>
            {goals.length > 0 && (
              <Group
                title="Metas" icon={<Target size={13} />} color="var(--cyan)"
                total={goalSecs} items={goals} dayTotal={dayTotal} secsOf={secsOf}
              />
            )}
            {habits.length > 0 && (
              <Group
                title="Hábitos" icon={<Repeat2 size={13} />} color="var(--green)"
                total={habitSecs} items={habits} dayTotal={dayTotal} secsOf={secsOf}
              />
            )}
          </div>
        </>
      )}
    </section>
  )
}

function NavButton({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title: string }) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        color: disabled ? 'var(--dim)' : 'var(--muted)', cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

interface GroupProps {
  title: string
  icon: React.ReactNode
  color: string
  total: number
  items: DateHistoryItem[]
  dayTotal: number
  secsOf: (it: DateHistoryItem) => number
}

function Group({ title, icon, color, total, items, dayTotal, secsOf }: GroupProps) {
  const sorted = [...items].sort((a, b) => secsOf(b) - secsOf(a))
  const max = secsOf(sorted[0]) || 1

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        paddingBottom: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color }}>
          {icon}
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{title}</span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            <Layers size={10} style={{ verticalAlign: '-1px', marginRight: '3px' }} />{items.length}
          </span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{formatTime(total)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {sorted.map(it => {
          const secs = secsOf(it)
          return (
            <div key={it.id} style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', background: it.color,
                    boxShadow: `0 0 6px ${it.color}`, flexShrink: 0, transform: 'translateY(-1px)',
                  }} />
                  <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
                    {it.title}
                  </span>
                </div>
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: it.color, whiteSpace: 'nowrap' }}>
                  {formatTime(secs)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px', marginBottom: '6px', fontSize: '11px', color: 'var(--muted)', flexWrap: 'wrap' }}>
                <span>{it.sessions} {it.sessions === 1 ? 'sesión' : 'sesiones'}</span>
                <span>·</span>
                <span>{Math.round((secs / (dayTotal || 1)) * 100)}% del día</span>
                {it.running && (
                  <span style={{ color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--amber)', boxShadow: 'var(--glow-amber)' }} />
                    en curso
                  </span>
                )}
              </div>
              <div style={{ marginLeft: '16px', height: '5px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.round((secs / max) * 100)}%`,
                  background: `linear-gradient(90deg, ${it.color}66, ${it.color})`,
                  borderRadius: '4px', boxShadow: `0 0 8px ${it.color}66`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
