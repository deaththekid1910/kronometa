'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { GoalWithStats } from '@/types'
import HabitStreak from '@/components/habits/HabitStreak'
import HabitLogModal from '@/components/habits/HabitLogModal'
import TimerWidget from '@/components/timer/TimerWidget'
import EditGoalModal from '@/components/goals/EditGoalModal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getTotalSeconds, formatTime } from '@/lib/timer'
import { localDateKey, currentStreak } from '@/lib/dates'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Panel, ModalBackdrop, InlineConfirm, actionBtn } from '@/components/ui/Layout'
import { ArrowLeft, Clock, Flame, Calendar, CheckCircle2, RotateCcw, Trash2, Pencil, History } from 'lucide-react'

export default function HabitDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const [habit,     setHabit]     = useState<GoalWithStats | null>(null)
  const [logs,      setLogs]      = useState<{ logged_date: string; notes?: string; duration_seconds: number }[]>([])
  const [userId,    setUserId]    = useState('')
  const [totalSecs, setTotalSecs] = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [showLog,   setShowLog]   = useState(false)
  const [showEdit,  setShowEdit]  = useState(false)
  const [confirmDel,setConfirmDel]= useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmUnmarkDate, setConfirmUnmarkDate] = useState<string | null>(null)
  const bp        = useBreakpoint()
  const isMobile  = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  useEffect(() => { loadHabit() }, [id])

  async function loadHabit() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data } = await supabase
      .from('goals').select('*').eq('id', id).single()

    if (data) {
      setHabit(data)
      const { data: habitLogs } = await supabase
        .from('habit_logs').select('*')
        .eq('goal_id', id)
        .order('logged_date', { ascending: false })
        .limit(90)
      setLogs(habitLogs || [])
      const secs = await getTotalSeconds(id)
      setTotalSecs(secs)
    }
    setLoading(false)
  }

  async function handleUnmarkDay(date: string) {
    const supabase = createClient()
    await supabase
      .from('habit_logs')
      .delete()
      .eq('goal_id', id)
      .eq('logged_date', date)
    setLogs(prev => prev.filter(l => l.logged_date !== date))
    setConfirmUnmarkDate(null)
  }

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('goals').update({ archived: true }).eq('id', id)
    router.push('/habits')
    router.refresh()
  }

  // Fechas locales (los registros se guardan con la fecha local del usuario)
  const today          = localDateKey()
  const completedToday = logs.some(l => l.logged_date === today)
  const streak         = currentStreak(new Set(logs.map(l => l.logged_date)))
  const thisMonth      = logs.filter(l => l.logged_date.startsWith(today.slice(0, 7))).length
  const accent         = habit?.color || 'var(--cyan)'

  const badgeColor = (() => {
    if (accent === '#00F5FF') return 'cyan'
    if (accent === '#B026FF') return 'purple'
    if (accent === '#00FF88') return 'green'
    if (accent === '#FFB800') return 'amber'
    return 'gray'
  })() as 'cyan' | 'purple' | 'green' | 'amber' | 'gray'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      cargando...
    </div>
  )

  if (!habit) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px' }}>
      <p style={{ color: 'var(--muted)' }}>Hábito no encontrado</p>
      <Button variant="ghost" size="sm" onClick={() => router.back()}>Volver</Button>
    </div>
  )

  return (
    <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: isMobile ? '12px' : '24px 20px', boxSizing: 'border-box' }}>

      {/* HEADER: barra de acciones arriba, título a todo el ancho debajo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--muted)', cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }} />
        <TimerWidget goalId={habit.id} color={accent} />

        {/* BOTÓN EDITAR */}
        <button
          onClick={() => setShowEdit(true)}
          title="Editar hábito"
          style={{
            width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
            background: `${accent}15`, border: `1px solid ${accent}40`,
            color: accent, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Pencil size={15} />
        </button>

        {/* BOTÓN ELIMINAR */}
        <button
          onClick={() => setConfirmDel(true)}
          title="Eliminar hábito"
          style={{
            width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
            background: '#FF386010', border: '1px solid #FF386030',
            color: 'var(--red)', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#FF386025'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FF386010'}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ marginBottom: '24px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0, lineHeight: 1.3, overflowWrap: 'anywhere' }}>{habit.title}</h1>
          <Badge color={badgeColor}>Hábito</Badge>
          {completedToday && <Badge color="green" dot>Completado hoy</Badge>}
          {habit.reminder_time && (
            <Badge color={badgeColor}>⏰ {habit.reminder_time.slice(0, 5)}</Badge>
          )}
        </div>
      </div>

      {/* CONFIRM ELIMINAR */}
      {confirmDel && (
        <div style={{
          background: '#FF386010', border: '1px solid #FF386033',
          borderRadius: 'var(--radius-md)', padding: '14px 16px',
          marginBottom: '20px', display: 'flex', alignItems: 'center',
          gap: '12px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1 }}>
            ¿Eliminar <strong>{habit.title}</strong> y todo su historial?
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setConfirmDel(false)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--red)', border: 'none',
              color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
            }}>
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
          </div>
        </div>
      )}

      {(() => {
        /* ── RESUMEN: cifras y cuadrícula de las últimas 2 semanas ── */
        const summary = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              {[
                { icon: <Flame size={14} />,        label: 'Racha actual', value: `${streak}d`,         color: 'var(--amber)', mono: false },
                { icon: <CheckCircle2 size={14} />, label: 'Total días',   value: `${logs.length}d`,     color: accent,         mono: false },
                { icon: <Clock size={14} />,        label: 'Tiempo total', value: formatTime(totalSecs), color: 'var(--cyan)',  mono: true },
                { icon: <Calendar size={14} />,     label: 'Este mes',     value: `${thisMonth}d`,       color: 'var(--purple)', mono: false },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px', minWidth: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
                    <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>{s.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: s.color, fontFamily: s.mono ? 'var(--font-mono)' : 'var(--font-sans)' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px' : '18px',
            }}>
              <HabitStreak logs={logs} color={accent} />
            </div>
          </div>
        )

        /* ── ACCIÓN DE HOY + HISTORIAL ── */
        const main = (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px', minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap',
              padding: isMobile ? '16px' : '18px 20px', borderRadius: 'var(--radius-lg)',
              background: completedToday ? `${accent}10` : 'var(--surface)',
              border: `1px solid ${completedToday ? accent + '55' : 'var(--border)'}`,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 600 }}>HOY</div>
                <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px', textTransform: 'capitalize' }}>
                  {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <button
                onClick={() => !completedToday && setShowLog(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '11px 22px', borderRadius: '30px',
                  border: `1px solid ${completedToday ? accent + '44' : accent}`,
                  background: completedToday ? accent + '15' : accent,
                  color: completedToday ? accent : '#0A0E1A',
                  fontSize: '14px', fontWeight: 600,
                  cursor: completedToday ? 'default' : 'pointer',
                  boxShadow: completedToday ? 'none' : `0 0 20px ${accent}44`,
                }}
              >
                <CheckCircle2 size={16} />
                {completedToday ? '¡Completado hoy!' : 'Marcar como hecho hoy'}
              </button>
            </div>

            <Panel icon={<History size={14} />} title="Historial reciente" color={accent} count={logs.length} isMobile={isMobile}
              subtitle={logs.length > 14 ? 'Últimos 14 días registrados' : undefined}>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem 1rem', margin: 0 }}>
                  Aún no has registrado este hábito. ¡Empieza hoy!
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {logs.slice(0, 14).map(log => {
                    const label = new Date(log.logged_date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })
                    const asking = confirmUnmarkDate === log.logged_date
                    return (
                      <div key={log.logged_date} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                        padding: '10px 12px 10px 14px', borderRadius: 'var(--radius-md)',
                        background: asking ? '#FF386008' : 'var(--surface2)',
                        border: `1px solid ${asking ? '#FF386033' : 'var(--border)'}`,
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}66`, flexShrink: 0 }} />
                        <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                          <div style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                            {log.logged_date === today ? 'Hoy' : label}
                          </div>
                          {log.notes && (
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.45, overflowWrap: 'anywhere' }}>
                              {log.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                          {asking ? (
                            <InlineConfirm text="¿Desmarcar este día?" confirmLabel="Sí, desmarcar"
                              onConfirm={() => handleUnmarkDay(log.logged_date)} onCancel={() => setConfirmUnmarkDate(null)} />
                          ) : (
                            <>
                              <span style={{ fontSize: '11px', color: accent }}>✓ completado</span>
                              <button onClick={() => setConfirmUnmarkDate(log.logged_date)} title="Desmarcar este día"
                                aria-label="Desmarcar este día" style={actionBtn('#FFB800')}>
                                <RotateCcw size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          </div>
        )

        // PC: acción e historial a la izquierda, resumen a la derecha · móvil: resumen primero
        return (
          <div style={{
            display: 'grid', alignItems: 'start', gap: isMobile ? '12px' : '16px',
            gridTemplateColumns: isDesktop ? 'minmax(0, 1.6fr) minmax(300px, 1fr)' : 'minmax(0, 1fr)',
          }}>
            {isDesktop ? <>{main}{summary}</> : <>{summary}{main}</>}
          </div>
        )
      })()}

      {showEdit && (
        <ModalBackdrop>
          <EditGoalModal
            goal={habit}
            onSave={updated => setHabit(h => h ? { ...h, ...updated } : h)}
            onClose={() => setShowEdit(false)}
          />
        </ModalBackdrop>
      )}

      {showLog && (
        <ModalBackdrop>
          <HabitLogModal
            goalId={habit.id}
            userId={userId}
            color={accent}
            onLogged={() => {
              setLogs(prev => [{ logged_date: today, duration_seconds: 0 }, ...prev])
              setShowLog(false)
            }}
            onClose={() => setShowLog(false)}
          />
        </ModalBackdrop>
      )}
    </div>
  )
}