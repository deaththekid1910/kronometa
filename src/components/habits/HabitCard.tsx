'use client'

import { GoalWithStats } from '@/types'
import TimerWidget from '@/components/timer/TimerWidget'
import { ItemFooter, chip, actionBtn } from '@/components/ui/Layout'
import { Repeat2, Flame, Pencil, Trash2, Bell, Check } from 'lucide-react'

interface Props {
  habit: GoalWithStats
  streak: number
  completedToday: boolean
  week?: { key: string; date: Date; done: boolean }[]   // últimos 7 días
  onClick: () => void
  onMarkToday: (e: React.MouseEvent) => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function HabitCard({ habit, streak, completedToday, week, onClick, onMarkToday, onEdit, onDelete }: Props) {
  const accent = habit.color

  return (
    <div
      onClick={onClick}
      style={{
        background: completedToday ? `${accent}08` : 'var(--surface2)',
        border: `1px solid ${completedToday ? accent + '44' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', overflow: 'hidden',
        cursor: 'pointer', transition: 'all var(--transition)',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '66' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = completedToday ? accent + '44' : 'var(--border)' }}
    >
      {/* CUERPO: ícono, título, racha y semana */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px 12px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
          background: accent + '15', border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Repeat2 size={17} color={accent} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 title={habit.title} style={{
            margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)',
            lineHeight: 1.35, overflowWrap: 'anywhere',
          }}>
            {habit.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Flame size={12} color="var(--amber)" />
            <span style={{ fontSize: '12px', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
              {streak}d de racha
            </span>
          </div>

          {week && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }} aria-label="Últimos 7 días">
              {week.map(d => (
                <div key={d.key} title={d.date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'short' })}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flex: 1, maxWidth: '30px' }}>
                  <div style={{
                    width: '100%', height: '8px', borderRadius: '3px',
                    background: d.done ? accent : 'var(--border)',
                    boxShadow: d.done ? `0 0 6px ${accent}66` : 'none',
                  }} />
                  <span style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                    {d.date.toLocaleDateString('es-VE', { weekday: 'narrow' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIE: marcar hoy + recordatorio · cronómetro y acciones */}
      <div onClick={e => e.stopPropagation()}>
        <ItemFooter
          meta={<>
            <button
              onClick={onMarkToday}
              disabled={completedToday}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px',
                border: `1px solid ${completedToday ? accent + '44' : accent}`,
                background: completedToday ? accent + '15' : accent,
                color: completedToday ? accent : '#0A0E1A',
                fontSize: '12px', fontWeight: 600,
                cursor: completedToday ? 'default' : 'pointer',
              }}
            >
              <Check size={13} strokeWidth={3} />
              {completedToday ? 'Hecho hoy' : 'Marcar hoy'}
            </button>
            {habit.reminder_time && (
              <span style={{ ...chip('#00F5FF'), fontFamily: 'var(--font-mono)' }}>
                <Bell size={11} /> {habit.reminder_time.slice(0, 5)}
              </span>
            )}
          </>}
          actions={<>
            <TimerWidget goalId={habit.id} color={accent} />
            {onEdit && (
              <button onClick={onEdit} title="Editar hábito" aria-label="Editar hábito" style={actionBtn(accent)}>
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} title="Eliminar hábito" aria-label="Eliminar hábito" style={actionBtn('#FF3860')}>
                <Trash2 size={13} />
              </button>
            )}
          </>}
        />
      </div>
    </div>
  )
}
