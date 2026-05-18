'use client'

import { useRouter } from 'next/navigation'
import { useNotificationStore, AppNotification } from '@/store/notificationStore'
import { X, CheckCheck } from 'lucide-react'

interface Props {
  onClose: () => void
}

function NotifItem({ notif, onClose }: { notif: AppNotification; onClose: () => void }) {
  const { markRead } = useNotificationStore()
  const router = useRouter()

  function handleClick() {
    markRead(notif.id)
    if (notif.goalId) {
      router.push(`/goals/${notif.goalId}`)
      onClose()
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '12px 14px', cursor: notif.goalId ? 'pointer' : 'default',
        background: notif.read ? 'transparent' : `${notif.color}06`,
        borderBottom: '1px solid var(--border)',
        transition: 'background var(--transition)',
        position: 'relative',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#ffffff05' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = notif.read ? 'transparent' : `${notif.color}06` }}
    >
      {!notif.read && (
        <div style={{
          position: 'absolute', top: '14px', right: '14px',
          width: '6px', height: '6px', borderRadius: '50%',
          background: notif.color, boxShadow: `0 0 6px ${notif.color}`,
        }} />
      )}

      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: notif.color + '15', border: `1px solid ${notif.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '17px',
      }}>
        {notif.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px', fontWeight: 500,
          color: notif.read ? 'var(--muted)' : 'var(--text)',
          marginBottom: '3px',
        }}>
          {notif.title}
        </div>
        <div style={{
          fontSize: '11px', color: 'var(--muted)',
          lineHeight: 1.5,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {notif.message}
        </div>
      </div>
    </div>
  )
}

export default function NotificationPanel({ onClose }: Props) {
  const { notifications, unreadCount, markAllRead } = useNotificationStore()

  const overdue  = notifications.filter(n => n.type === 'overdue')
  const today    = notifications.filter(n => n.type === 'due_today')
  const soon     = notifications.filter(n => n.type === 'due_soon')

  function Section({ title, items, color }: { title: string; items: AppNotification[]; color: string }) {
    if (items.length === 0) return null
    return (
      <div>
        <div style={{
          fontSize: '10px', color, letterSpacing: '1px',
          fontWeight: 500, padding: '10px 14px 6px',
          background: 'var(--surface2)',
        }}>
          {title} · {items.length}
        </div>
        {items.map(n => <NotifItem key={n.id} notif={n} onClose={onClose} />)}
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0,
      width: '340px', maxHeight: '480px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      zIndex: 60, marginTop: '8px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Notificaciones</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: '11px', fontFamily: 'var(--font-mono)',
              background: 'var(--red)', color: '#fff',
              padding: '1px 7px', borderRadius: '20px', fontWeight: 600,
            }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', color: 'var(--cyan)',
              fontSize: '11px', cursor: 'pointer', padding: '4px',
            }}>
              <CheckCheck size={13} />
              Leer todo
            </button>
          )}
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--muted)',
            cursor: 'pointer', padding: '4px', display: 'flex',
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem',
            color: 'var(--dim)', fontSize: '13px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
            Todo al día, sin vencimientos próximos
          </div>
        ) : (
          <>
            <Section title="VENCIDAS"          items={overdue} color="var(--red)" />
            <Section title="VENCE HOY"         items={today}   color="var(--amber)" />
            <Section title="PRÓXIMOS 3 DÍAS"   items={soon}    color="var(--cyan)" />
          </>
        )}
      </div>
    </div>
  )
}