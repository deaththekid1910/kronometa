'use client'

import { SubGoal } from '@/types'

interface Props {
  subGoal: SubGoal
  index: number
  total: number
  color: string
  isActive: boolean
  isCurrent: boolean
  xPos: number
  yPos: number
  onClick: () => void
}

export default function SubGoalNode({
  subGoal, index, total, color,
  isActive, isCurrent, xPos, yPos, onClick
}: Props) {
  const done = !!subGoal.completed_at
  const size = isCurrent ? 44 : done ? 36 : 30

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${xPos}%`,
        top: `${yPos}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '6px',
        cursor: 'pointer', zIndex: isCurrent ? 10 : done ? 5 : 3,
        transition: 'all 0.4s ease',
      }}
    >
      {/* BADGE "ACTUAL" — solo en el nodo activo */}
      {isCurrent && (
        <div style={{
          background: color, color: '#0A0E1A',
          borderRadius: '8px', padding: '2px 8px',
          fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 12px ${color}66`,
        }}>
          ACTUAL
        </div>
      )}

      {/* NODO */}
      <div style={{
        width: `${size}px`, height: `${size}px`,
        borderRadius: '50%',
        background: done
          ? `radial-gradient(circle, ${color}cc, ${color}66)`
          : isCurrent
          ? `radial-gradient(circle, ${color}44, ${color}11)`
          : 'radial-gradient(circle, #1F293799, #0A0E1A99)',
        border: `${isCurrent ? 3 : 2}px solid ${done ? color : isCurrent ? color : '#374151'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: done
          ? `0 0 16px ${color}88, 0 0 32px ${color}44`
          : isCurrent
          ? `0 0 20px ${color}66, 0 0 40px ${color}22`
          : 'none',
        transition: 'all 0.4s ease',
        animation: isCurrent ? 'node-pulse 2s ease-in-out infinite' : 'none',
        fontSize: done ? '16px' : isCurrent ? '14px' : '12px',
      }}>
        {done ? '✓' : isCurrent ? '★' : `${index + 1}`}
      </div>

      {/* TÍTULO — vista previa debajo de cada paso */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
        maxWidth: '96px',
      }}>
        <span style={{
          fontSize: '8px', fontFamily: 'var(--font-mono)',
          color: done ? color : isCurrent ? color : 'var(--dim)',
          letterSpacing: '0.5px', lineHeight: 1,
        }}>
          #{String(index + 1).padStart(2, '0')}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: isCurrent ? 600 : done ? 500 : 400,
          color: isCurrent ? color : done ? 'var(--text)' : 'var(--muted)',
          textAlign: 'center',
          maxWidth: '96px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: done ? 'line-through' : 'none',
          opacity: done ? 0.85 : 1,
          padding: '2px 7px', borderRadius: '7px',
          background: 'rgba(10,14,26,0.78)',
          border: `1px solid ${isCurrent ? color + '66' : done ? color + '33' : 'transparent'}`,
          backdropFilter: 'blur(3px)',
          boxShadow: isCurrent ? `0 0 10px ${color}33` : 'none',
        }}>
          {subGoal.title}
        </span>
      </div>

      <style>{`
        @keyframes node-pulse {
          0%,100% { box-shadow: 0 0 20px ${color}66, 0 0 40px ${color}22; }
          50%      { box-shadow: 0 0 30px ${color}99, 0 0 60px ${color}44; }
        }
      `}</style>
    </div>
  )
}
