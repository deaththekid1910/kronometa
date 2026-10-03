'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DailyTask } from '@/types/dailyTask'
import { localToday, formatTaskDate } from '@/lib/dailyTasks'
import DailyTaskItem from '@/components/daily/DailyTaskItem'
import AddDailyTaskModal from '@/components/daily/AddDailyTaskModal'
import TaskHistory from '@/components/daily/TaskHistory'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { ListChecks, Plus, Sun, CheckCircle2, AlertTriangle, History } from 'lucide-react'

const ACCENT = '#00F5FF'

type Tab = 'today' | 'overdue' | 'history'
const TAB_KEY = 'kronometa.daily.tab'

export default function DailyTasksPage() {
  const [tasks,      setTasks]      = useState<DailyTask[]>([])
  const [userId,     setUserId]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [historyTick, setHistoryTick] = useState(0)   // avisa a TaskHistory que recargue
  const [tab,        setTab]        = useState<Tab>('today')

  const today    = localToday()
  const bp       = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY) as Tab | null
      if (saved === 'today' || saved === 'overdue' || saved === 'history') setTab(saved)
    } catch {}
    loadTasks()
  }, [])

  function selectTab(t: Tab) {
    setTab(t)
    try { localStorage.setItem(TAB_KEY, t) } catch {}
  }

  async function loadTasks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    // Carga solo lo relevante: pendientes (de hoy o atrasadas) + completadas de hoy.
    // Evita arrastrar el historial de días anteriores ya completado.
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('user_id', user.id)
      .or(`completed_at.is.null,task_date.eq.${today}`)
      .order('reminder_time', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (data) setTasks(data)
    setLoading(false)
  }

  // ── Handlers ──
  // Todas mutan `tasks` y avisan a TaskHistory (historyTick) de que hay un
  // cambio para que se mantenga sincronizado sin perder sus filtros/página.
  function handleAdd(task: DailyTask) {
    setTasks(prev => [...prev, task])
    setHistoryTick(v => v + 1)
  }
  function handleComplete(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed_at: new Date().toISOString() } : t))
    setHistoryTick(v => v + 1)
  }
  function handleUncomplete(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed_at: null } : t))
    setHistoryTick(v => v + 1)
  }
  function handleUpdate(updated: DailyTask) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setHistoryTick(v => v + 1)
  }
  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setHistoryTick(v => v + 1)
  }

  // Cambios que vienen DESDE el historial (reactivar/completar/editar/borrar
  // una tarea vieja): reflejarlos aquí para que suba a HOY/INCOMPLETAS al toque.
  function handleHistoryTaskChanged(task: DailyTask) {
    setTasks(prev => {
      const belongsInMainList = !task.completed_at || task.task_date === today
      const exists = prev.some(t => t.id === task.id)
      if (!belongsInMainList) return exists ? prev.filter(t => t.id !== task.id) : prev
      return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task]
    })
  }
  function handleHistoryTaskDeleted(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // ── Agrupación ──
  const todayPending   = tasks.filter(t => t.task_date === today && !t.completed_at)
  const todayDone      = tasks.filter(t => t.task_date === today && t.completed_at)
  const overdue        = tasks.filter(t => t.task_date < today && !t.completed_at)
  // Las atrasadas que se completan hoy desaparecen de "incompletas"; no se muestran aparte.

  // Atrasadas agrupadas por día (de la más reciente a la más antigua)
  const overdueByDate: { date: string; items: DailyTask[] }[] = []
  for (const t of [...overdue].sort((a, b) => b.task_date.localeCompare(a.task_date))) {
    const last = overdueByDate[overdueByDate.length - 1]
    if (last && last.date === t.task_date) last.items.push(t)
    else overdueByDate.push({ date: t.task_date, items: [t] })
  }

  const totalToday = todayPending.length + todayDone.length
  const pctToday   = totalToday > 0 ? Math.round((todayDone.length / totalToday) * 100) : 0

  const itemProps = {
    onComplete: handleComplete, onUncomplete: handleUncomplete,
    onUpdate: handleUpdate, onDelete: handleDelete,
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string; count?: number }[] = [
    { id: 'today',   label: 'Hoy',         icon: <Sun size={14} />,           color: ACCENT,         count: todayPending.length },
    { id: 'overdue', label: 'Incompletas', icon: <AlertTriangle size={14} />, color: 'var(--amber)', count: overdue.length },
    { id: 'history', label: 'Historial',   icon: <History size={14} />,       color: '#FFB800' },
  ]

  return (
    <div style={{
      maxWidth: '1100px', width: '100%', margin: '0 auto', boxSizing: 'border-box',
      padding: isMobile ? '12px' : '24px 20px',
      display: 'flex', flexDirection: 'column', gap: isMobile ? '14px' : '18px',
    }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#00F5FF0D', border: '1px solid #00F5FF30',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ListChecks size={18} color={ACCENT} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, margin: 0 }}>Tareas diarias</h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0', textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}
          style={{ background: ACCENT, color: '#0A0E1A', flexShrink: 0 }}>
          Nueva tarea
        </Button>
      </div>

      {/* INDICADORES */}
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
        gap: isMobile ? '8px' : '10px',
      }}>
        {[
          { label: 'Por hacer hoy',   value: String(todayPending.length), color: ACCENT },
          { label: 'Completadas hoy', value: String(todayDone.length),    color: 'var(--green)' },
          { label: 'Incompletas',     value: String(overdue.length),      color: 'var(--amber)' },
          { label: 'Progreso de hoy', value: `${pctToday}%`,              color: pctToday === 100 ? 'var(--green)' : 'var(--purple)', bar: true },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: isMobile ? '11px 12px' : '14px 16px', minWidth: 0,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>
              {s.value}
            </div>
            {s.bar && (
              <div style={{ height: '4px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px' }}>
                <div style={{ height: '100%', width: `${pctToday}%`, background: s.color, transition: 'width 0.6s ease' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PESTAÑAS */}
      <nav role="tablist" style={{
        display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', scrollbarWidth: 'none',
      }}>
        {TABS.map(t => {
          const active = t.id === tab
          return (
            <button
              key={t.id} role="tab" aria-selected={active} onClick={() => selectTab(t.id)}
              style={{
                flex: isMobile ? '1 0 auto' : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: isMobile ? '8px 12px' : '9px 14px',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', whiteSpace: 'nowrap',
                fontSize: '13px', fontWeight: active ? 600 : 500,
                color: active ? t.color : 'var(--muted)',
                background: active ? '#ffffff0a' : 'transparent',
                border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                boxShadow: active ? `inset 0 -2px 0 ${t.color}` : 'none',
                transition: 'all var(--transition)',
              }}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span style={{
                  minWidth: '20px', padding: '1px 6px', borderRadius: '10px', boxSizing: 'border-box',
                  fontSize: '11px', fontFamily: 'var(--font-mono)', textAlign: 'center',
                  background: active ? `${t.color === ACCENT ? '#00F5FF' : '#FFB800'}22` : '#ffffff0d',
                  color: active ? t.color : 'var(--muted)',
                }}>{t.count}</span>
              )}
            </button>
          )
        })}
      </nav>

      {loading && tab !== 'history' ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : tab === 'today' ? (
        /* ── HOY: por hacer y completadas, cada una en su panel ── */
        <div style={{
          display: 'grid', alignItems: 'start',
          gridTemplateColumns: isDesktop ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
          gap: isMobile ? '12px' : '16px',
        }}>
          <Panel icon={<Sun size={14} />} title="Por hacer" color={ACCENT} count={todayPending.length} isMobile={isMobile}>
            {todayPending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <ListChecks size={30} color={ACCENT} style={{ opacity: 0.4, marginBottom: '10px' }} />
                <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 14px' }}>
                  {todayDone.length > 0 ? '¡Todo listo por hoy! 🎉' : 'Sin tareas para hoy'}
                </p>
                <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(true)}
                  style={{ background: `${ACCENT}12`, color: ACCENT, borderColor: `${ACCENT}30` }}>
                  Agregar tarea
                </Button>
              </div>
            ) : (
              <List>
                {todayPending.map(t => <DailyTaskItem key={t.id} task={t} color={ACCENT} {...itemProps} />)}
              </List>
            )}
          </Panel>

          <Panel icon={<CheckCircle2 size={14} />} title="Completadas" color="var(--green)" count={todayDone.length} isMobile={isMobile}>
            {todayDone.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem 1rem', margin: 0 }}>
                Las tareas que completes hoy aparecerán aquí.
              </p>
            ) : (
              <List>
                {todayDone.map(t => <DailyTaskItem key={t.id} task={t} color="#00FF88" {...itemProps} />)}
              </List>
            )}
          </Panel>
        </div>
      ) : tab === 'overdue' ? (
        /* ── INCOMPLETAS: agrupadas por el día al que pertenecían ── */
        <Panel icon={<AlertTriangle size={14} />} title="Incompletas" subtitle="De días anteriores · complétalas o elimínalas"
          color="var(--amber)" count={overdue.length} isMobile={isMobile}>
          {overdue.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '2rem 1rem', margin: 0 }}>
              No tienes tareas atrasadas. ¡Bien hecho! ✨
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {overdueByDate.map(g => (
                <div key={g.date}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
                    fontSize: '11px', fontWeight: 600, color: 'var(--amber)', letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                  }}>
                    {formatTaskDate(g.date)}
                    <span style={{ fontWeight: 400, color: 'var(--muted)', textTransform: 'none', letterSpacing: 0 }}>
                      · {g.items.length} {g.items.length === 1 ? 'tarea' : 'tareas'}
                    </span>
                    <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  </div>
                  <List columns={isDesktop}>
                    {g.items.map(t => <DailyTaskItem key={t.id} task={t} color="#FFB800" overdue {...itemProps} />)}
                  </List>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {/* HISTORIAL COMPLETO — se mantiene montado para no perder filtros al cambiar de pestaña */}
      {userId && (
        <div style={{ display: tab === 'history' ? 'block' : 'none' }}>
          <TaskHistory
            userId={userId}
            refreshToken={historyTick}
            isMobile={isMobile}
            onTaskChanged={handleHistoryTaskChanged}
            onTaskDeleted={handleHistoryTaskDeleted}
          />
        </div>
      )}

      {/* MODAL AGREGAR */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <AddDailyTaskModal
            userId={userId}
            color={ACCENT}
            onAdd={handleAdd}
            onClose={() => setShowAdd(false)}
          />
        </div>
      )}
    </div>
  )
}

// Panel con cabecera propia (ícono, título, contador) para cada sección
function Panel({ icon, title, subtitle, color, count, isMobile, children }: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  color: string
  count: number
  isMobile: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px' : '18px', minWidth: 0,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        paddingBottom: '12px', marginBottom: '14px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ color, display: 'flex' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: '12px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color }}>
            {title}
          </h2>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>{subtitle}</p>}
        </div>
        <Badge color={color === ACCENT ? 'cyan' : color === 'var(--green)' ? 'green' : 'amber'}>{count}</Badge>
      </header>
      {children}
    </section>
  )
}

// Lista de tareas; con `columns` usa dos columnas (PC, paneles anchos)
function List({ children, columns = false }: { children: React.ReactNode; columns?: boolean }) {
  return (
    <div style={{
      display: 'grid', gap: '10px', alignItems: 'start',
      gridTemplateColumns: columns ? 'repeat(auto-fill, minmax(380px, 1fr))' : 'minmax(0, 1fr)',
    }}>
      {children}
    </div>
  )
}
