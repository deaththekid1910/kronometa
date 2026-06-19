'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getDailyHistory, DayBreakdown, DateHistoryItem } from '@/lib/reports'
import { formatTime, getActiveSession } from '@/lib/timer'
import { useTimerStore } from '@/store/timerStore'
import { CalendarSearch, Target, Repeat2, Clock, ChevronDown, X } from 'lucide-react'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function niceDate(date: string): string {
  const today = todayStr()
  if (date === today) return 'Hoy'
  const y = new Date(); y.setDate(y.getDate() - 1)
  const yStr = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
  if (date === yStr) return 'Ayer'
  return new Date(date + 'T12:00:00').toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

const ACCENT = '#FFB800'

interface Props { isMobile: boolean }

export default function DateHistorySection({ isMobile }: Props) {
  const [days,     setDays]     = useState<DayBreakdown[]>([])
  const [loading,  setLoading]  = useState(true)
  const [open,     setOpen]     = useState<Record<string, boolean>>({})
  const [filter,   setFilter]   = useState('')      // 'YYYY-MM-DD' o '' (todos)
  const firstLoad = useRef(true)

  // Sesión activa global (zustand): se actualiza al iniciar/detener cualquier
  // temporizador en la app, lo que dispara el refresco en vivo de aquí.
  const activeSession    = useTimerStore(s => s.activeSession)
  const setActiveSession = useTimerStore(s => s.setActiveSession)

  // Carga inicial (con spinner) + sincroniza la sesión activa global por si el
  // temporizador se arrancó en otra pantalla.
  useEffect(() => {
    load(false)
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const s = await getActiveSession(user.id)
      if (s) setActiveSession(s)
    })()
  }, [])

  // Recarga cuando arranca o se detiene una sesión (transición de activeSession).
  useEffect(() => {
    if (firstLoad.current) return   // la carga inicial ya lo cubre
    load(true)
  }, [activeSession?.id, activeSession?.is_active])

  // Mientras el cronómetro corre, refresca cada segundo para que el tiempo del
  // día suba en vivo.
  useEffect(() => {
    if (!activeSession?.is_active) return
    const id = setInterval(() => load(true), 1000)
    return () => clearInterval(id)
  }, [activeSession?.id, activeSession?.is_active])

  // Al volver a la pestaña, refresca por si se trabajó en otra parte.
  useEffect(() => {
    const onFocus = () => load(true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  async function load(silent = false) {
    if (!silent) setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const data = await getDailyHistory(user.id, 30)
    setDays(data)
    // El día más reciente arranca expandido (solo la primera vez, para no
    // pisar lo que el usuario haya plegado/desplegado en los refrescos).
    if (firstLoad.current && data[0]) setOpen({ [data[0].date]: true })
    firstLoad.current = false
    setLoading(false)
  }

  const visible = filter ? days.filter(d => d.date === filter) : days

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: isMobile ? '14px' : '20px',
      marginBottom: isMobile ? '14px' : '20px',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarSearch size={14} color={ACCENT} />
          <span style={{ fontSize: isMobile ? '10px' : '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
            HISTORIAL DIARIO
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="date"
            value={filter}
            max={todayStr()}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: '7px 12px', background: '#1a1a2e',
              border: `1px solid ${ACCENT}40`, borderRadius: 'var(--radius-sm)',
              color: ACCENT, fontSize: '13px', fontWeight: 600, outline: 'none',
              colorScheme: 'dark', fontFamily: 'var(--font-mono)', cursor: 'pointer',
            }}
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              title="Ver todos los días"
              style={{
                display: 'flex', alignItems: 'center', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                color: 'var(--muted)', cursor: 'pointer', padding: '6px',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* LISTA DE DÍAS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : visible.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
          color: 'var(--dim)', fontSize: '13px',
        }}>
          {filter
            ? 'No registraste tiempo en metas ni hábitos este día.'
            : 'Aún no hay tiempo registrado. Inicia un temporizador en una meta o hábito para empezar tu historial.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {visible.map(day => {
            const isOpen = open[day.date] ?? false
            return (
              <div key={day.date} style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}>
                {/* CABECERA DEL DÍA */}
                <button
                  onClick={() => setOpen(o => ({ ...o, [day.date]: !isOpen }))}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '10px',
                    padding: isMobile ? '10px 12px' : '12px 14px',
                    background: isOpen ? '#ffffff06' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <ChevronDown
                      size={14}
                      color="var(--muted)"
                      style={{ flexShrink: 0, transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
                    />
                    <span style={{
                      fontSize: '13px', color: 'var(--text)', fontWeight: 500,
                      textTransform: 'capitalize',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {niceDate(day.date)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--dim)', flexShrink: 0 }}>
                      · {day.items.length} {day.items.length === 1 ? 'actividad' : 'actividades'}
                    </span>
                  </div>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
                    fontSize: '13px', fontFamily: 'var(--font-mono)', color: ACCENT, fontWeight: 600,
                  }}>
                    <Clock size={12} /> {formatTime(day.totalSeconds)}
                  </span>
                </button>

                {/* DESGLOSE POR META / HÁBITO */}
                {isOpen && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    padding: isMobile ? '4px 12px 14px' : '4px 14px 16px',
                  }}>
                    {day.items.map(it => (
                      <BreakdownRow key={it.id} it={it} max={day.items[0].totalSeconds || 1} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function BreakdownRow({ it, max }: { it: DateHistoryItem; max: number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '5px', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ color: it.color, display: 'flex', flexShrink: 0 }}>
            {it.type === 'habit' ? <Repeat2 size={13} /> : <Target size={13} />}
          </span>
          <span style={{
            fontSize: '13px', color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{it.title}</span>
          <span style={{ fontSize: '10px', color: 'var(--dim)', flexShrink: 0 }}>
            · {it.sessions} {it.sessions === 1 ? 'sesión' : 'sesiones'}
          </span>
        </div>
        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: it.color, flexShrink: 0, fontWeight: 600 }}>
          {formatTime(it.totalSeconds)}
        </span>
      </div>
      <div style={{ height: '5px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.round((it.totalSeconds / max) * 100)}%`,
          background: `linear-gradient(90deg, ${it.color}66, ${it.color})`,
          borderRadius: '4px',
          boxShadow: `0 0 8px ${it.color}66`,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}
