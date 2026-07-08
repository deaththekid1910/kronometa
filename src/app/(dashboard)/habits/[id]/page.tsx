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
import { ArrowLeft, Clock, Flame, Calendar, CheckCircle2, RotateCcw, Trash2, Pencil } from 'lucide-react'

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

  useEffect(() => { loadHabit() }, [id])

  async function loadHabit() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
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

  function getStreak(): number {
    const logDates = new Set(logs.map(l => l.logged_date))
    let streak = 0
    for (let i = 0; i <= 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      if (logDates.has(key)) { streak++ } else if (i > 0) { break }
    }
    return streak
  }

  const today          = new Date().toISOString().split('T')[0]
  const completedToday = logs.some(l => l.logged_date === today)
  const streak         = getStreak()
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
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '34px', height: '34px', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--muted)', cursor: 'pointer', flexShrink: 0,
        }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{habit.title}</h1>
            <Badge color={badgeColor}>Hábito</Badge>
            {completedToday && <Badge color="green" dot>Completado hoy</Badge>}
            {habit.reminder_time && (
              <Badge color={badgeColor}>⏰ {habit.reminder_time.slice(0, 5)}</Badge>
            )}
          </div>
        </div>
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

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { icon: <Flame size={14} />,        label: 'Racha actual',  value: `${streak}d`,          color: 'var(--amber)' },
          { icon: <CheckCircle2 size={14} />, label: 'Total días',    value: `${logs.length}d`,      color: accent },
          { icon: <Clock size={14} />,        label: 'Tiempo total',  value: formatTime(totalSecs),  color: 'var(--cyan)', mono: true },
          { icon: <Calendar size={14} />,     label: 'Este mes',
            value: `${logs.filter(l => l.logged_date.startsWith(new Date().toISOString().slice(0,7))).length}d`,
            color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--muted)', fontSize: '11px', marginBottom: '8px' }}>
              <span style={{ color: s.color }}>{s.icon}</span>{s.label}
            </div>
            <div style={{
              fontSize: '18px', fontWeight: 600, color: s.color,
              fontFamily: (s as any).mono ? 'var(--font-mono)' : 'var(--font-sans)',
            }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* STREAK */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '20px',
      }}>
        <HabitStreak logs={logs} color={accent} />
      </div>

      {/* BOTÓN MARCAR HOY */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => !completedToday && setShowLog(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: '30px',
            border: `1px solid ${completedToday ? accent + '44' : accent}`,
            background: completedToday ? accent + '15' : accent,
            color: completedToday ? accent : '#0A0E1A',
            fontSize: '14px', fontWeight: 600,
            cursor: completedToday ? 'default' : 'pointer',
            transition: 'all var(--transition)',
            boxShadow: completedToday ? 'none' : `0 0 20px ${accent}44`,
          }}
        >
          <span style={{ fontSize: '16px' }}>{completedToday ? '✓' : '○'}</span>
          {completedToday ? '¡Completado hoy!' : 'Marcar como hecho hoy'}
        </button>
      </div>

      {/* HISTORIAL */}
      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '12px', fontWeight: 500 }}>
            HISTORIAL RECIENTE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {logs.slice(0, 14).map(log => (
              <div key={log.logged_date}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: accent, boxShadow: `0 0 6px ${accent}66`, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--muted)', minWidth: '90px' }}>
                    {new Date(log.logged_date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  {log.notes && (
                    <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>{log.notes}</span>
                  )}
                  <span style={{ fontSize: '11px', color: accent, marginLeft: 'auto', flexShrink: 0 }}>✓ completado</span>

                  {/* BOTÓN DESMARCAR */}
                  <button
                    onClick={() => setConfirmUnmarkDate(log.logged_date)}
                    title="Desmarcar este día"
                    style={{
                      background: 'none', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '4px 6px', flexShrink: 0,
                      color: 'var(--dim)', cursor: 'pointer', display: 'flex',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--dim)'
                    }}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>

                {/* CONFIRM DESMARCAR DÍA */}
                {confirmUnmarkDate === log.logged_date && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', marginTop: '4px',
                    background: '#FF386010', border: '1px solid #FF386030',
                    borderRadius: 'var(--radius-sm)', flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)', flex: 1 }}>
                      ¿Desmarcar el {new Date(log.logged_date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })}?
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleUnmarkDay(log.logged_date)} style={{
                        padding: '4px 12px', borderRadius: '6px',
                        background: 'var(--red)', border: 'none',
                        color: '#fff', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                      }}>Sí</button>
                      <button onClick={() => setConfirmUnmarkDate(null)} style={{
                        padding: '4px 12px', borderRadius: '6px',
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--muted)', fontSize: '11px', cursor: 'pointer',
                      }}>No</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <EditGoalModal
            goal={habit}
            onSave={updated => setHabit(h => h ? { ...h, ...updated } : h)}
            onClose={() => setShowEdit(false)}
          />
        </div>
      )}

      {showLog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
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
        </div>
      )}
    </div>
  )
}