'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getHistoryByDate, DateHistoryItem } from '@/lib/reports'
import { formatTime } from '@/lib/timer'
import { CalendarSearch, Target, Repeat2, Clock } from 'lucide-react'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const ACCENT = '#FFB800'

interface Props { isMobile: boolean }

export default function DateHistorySection({ isMobile }: Props) {
  const [date,    setDate]    = useState(todayStr())
  const [items,   setItems]   = useState<DateHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load(date) }, [date])

  async function load(d: string) {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const data = await getHistoryByDate(user.id, d)
    setItems(data)
    setLoading(false)
  }

  const total    = items.reduce((a, i) => a + i.totalSeconds, 0)
  const maxSecs  = items[0]?.totalSeconds || 1
  const niceDate = new Date(date + 'T12:00:00').toLocaleDateString('es-VE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

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
            HISTORIAL POR FECHA
          </span>
        </div>
        <input
          type="date"
          value={date}
          max={todayStr()}
          onChange={e => setDate(e.target.value)}
          style={{
            padding: '7px 12px', background: '#1a1a2e',
            border: `1px solid ${ACCENT}40`, borderRadius: 'var(--radius-sm)',
            color: ACCENT, fontSize: '13px', fontWeight: 600, outline: 'none',
            colorScheme: 'dark', fontFamily: 'var(--font-mono)', cursor: 'pointer',
          }}
        />
      </div>

      {/* RESUMEN DEL DÍA */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: '10px',
        marginBottom: '16px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text)', textTransform: 'capitalize' }}>
          {niceDate}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>·</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: ACCENT, fontWeight: 600 }}>
          <Clock size={12} /> {formatTime(total)}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          en {items.length} {items.length === 1 ? 'actividad' : 'actividades'}
        </span>
      </div>

      {/* LISTA */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '2rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)',
          color: 'var(--dim)', fontSize: '13px',
        }}>
          No registraste tiempo en metas ni hábitos este día.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.map(it => (
            <div key={it.id} style={{ minWidth: 0 }}>
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
                  width: `${Math.round((it.totalSeconds / maxSecs) * 100)}%`,
                  background: `linear-gradient(90deg, ${it.color}66, ${it.color})`,
                  borderRadius: '4px',
                  boxShadow: `0 0 8px ${it.color}66`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
