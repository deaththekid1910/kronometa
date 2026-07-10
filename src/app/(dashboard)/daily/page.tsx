'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { DailyTask } from '@/types/dailyTask'
import { localToday } from '@/lib/dailyTasks'
import DailyTaskItem from '@/components/daily/DailyTaskItem'
import AddDailyTaskModal from '@/components/daily/AddDailyTaskModal'
import TaskHistory from '@/components/daily/TaskHistory'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { ListChecks, Plus, Sun, CheckCircle2, AlertTriangle } from 'lucide-react'

const ACCENT = '#00F5FF'

export default function DailyTasksPage() {
  const [tasks,      setTasks]      = useState<DailyTask[]>([])
  const [userId,     setUserId]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [historyTick, setHistoryTick] = useState(0)   // avisa a TaskHistory que recargue

  const today = localToday()

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
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

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#00F5FF0D', border: '1px solid #00F5FF30',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ListChecks size={18} color={ACCENT} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Tareas diarias</h1>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0' }}>
              Tu lista de hoy, según tu zona horaria
            </p>
          </div>
        </div>
        <Button variant="primary" size="md" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}
          style={{ background: ACCENT, color: '#0A0E1A', flexShrink: 0 }}>
          Nueva tarea
        </Button>
      </div>

      {/* STATS */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px', marginBottom: '24px',
      }}>
        {[
          { label: 'Pendientes hoy', value: todayPending.length, color: ACCENT },
          { label: 'Completadas hoy', value: todayDone.length,    color: 'var(--green)' },
          { label: 'Incompletas',     value: overdue.length,      color: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          cargando...
        </div>
      ) : (
        <>
          {/* ── INCOMPLETAS (ATRASADAS) ── */}
          {overdue.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={14} color="var(--amber)" />
                <span style={{ fontSize: '11px', color: 'var(--amber)', letterSpacing: '1px', fontWeight: 600 }}>
                  INCOMPLETAS
                </span>
                <Badge color="amber">{overdue.length}</Badge>
                <span style={{ fontSize: '11px', color: 'var(--dim)' }}>
                  · de días anteriores
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overdue.map(t => (
                  <DailyTaskItem
                    key={t.id} task={t} color="#FFB800" overdue
                    onComplete={handleComplete} onUncomplete={handleUncomplete}
                    onUpdate={handleUpdate} onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── HOY (PENDIENTES) ── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sun size={14} color={ACCENT} />
              <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
                HOY
              </span>
              <Badge color="cyan">{todayPending.length}</Badge>
            </div>

            {todayPending.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem',
                background: 'var(--surface)',
                border: `1px dashed ${ACCENT}33`,
                borderRadius: 'var(--radius-lg)',
              }}>
                <ListChecks size={30} color={ACCENT} style={{ opacity: 0.4, marginBottom: '10px' }} />
                <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '12px' }}>
                  {todayDone.length > 0 ? '¡Todo listo por hoy! 🎉' : 'Sin tareas para hoy'}
                </p>
                <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(true)}
                  style={{ background: `${ACCENT}12`, color: ACCENT, borderColor: `${ACCENT}30` }}>
                  Agregar tarea
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayPending.map(t => (
                  <DailyTaskItem
                    key={t.id} task={t} color={ACCENT}
                    onComplete={handleComplete} onUncomplete={handleUncomplete}
                    onUpdate={handleUpdate} onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── COMPLETADAS HOY ── */}
          {todayDone.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckCircle2 size={14} color="var(--green)" />
                <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '1px', fontWeight: 500 }}>
                  COMPLETADAS HOY
                </span>
                <Badge color="green">{todayDone.length}</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {todayDone.map(t => (
                  <DailyTaskItem
                    key={t.id} task={t} color="#00FF88"
                    onComplete={handleComplete} onUncomplete={handleUncomplete}
                    onUpdate={handleUpdate} onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* HISTORIAL COMPLETO */}
      {userId && (
        <TaskHistory
          userId={userId}
          refreshToken={historyTick}
          onTaskChanged={handleHistoryTaskChanged}
          onTaskDeleted={handleHistoryTaskDeleted}
        />
      )}

      {/* MODAL AGREGAR */}
      {showAdd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 50,
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
