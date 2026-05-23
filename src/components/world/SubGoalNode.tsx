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
      {/* ETIQUETA */}
      {(isCurrent || done) && (
        <div style={{
          background: done ? color + '22' : '#0A0E1A',
          border: `1px solid ${color}${isCurrent ? '88' : '44'}`,
          borderRadius: '8px', padding: '4px 10px',
          fontSize: '10px', color: isCurrent ? color : 'var(--muted)',
          whiteSpace: 'nowrap', maxWidth: '120px',
          overflow: 'hidden', textOverflow: 'ellipsis',
          boxShadow: isCurrent ? `0 0 12px ${color}44` : 'none',
          fontWeight: isCurrent ? 500 : 400,
        }}>
          {subGoal.title}
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

      {/* NÚMERO para los no completados ni activos */}
      {!done && !isCurrent && (
        <div style={{
          fontSize: '10px', color: 'var(--dim)',
          fontFamily: 'var(--font-mono)',
        }}>
          #{index + 1}
        </div>
      )}

      <style>{`
        @keyframes node-pulse {
          0%,100% { box-shadow: 0 0 20px ${color}66, 0 0 40px ${color}22; }
          50%      { box-shadow: 0 0 30px ${color}99, 0 0 60px ${color}44; }
        }
      `}</style>
    </div>
  )
}