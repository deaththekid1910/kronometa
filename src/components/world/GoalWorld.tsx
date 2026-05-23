'use client'

import { useState } from 'react'
import { GoalWithStats, SubGoal } from '@/types'
import AvatarCharacter from './AvatarCharacter'
import SubGoalNode from './SubGoalNode'
import { formatTime } from '@/lib/timer'

interface Props {
  goal: GoalWithStats
  totalSeconds: number
  onSubGoalClick: (sg: SubGoal) => void
}

const WORLD_THEMES: Record<string, {
  bg: string
  ground: string
  sky: string
  stars: boolean
  mountains: string
}> = {
  cyber: {
    bg:        'linear-gradient(180deg, #020818 0%, #050d1f 40%, #0a1628 100%)',
    ground:    '#051020',
    sky:       '#020818',
    stars:     true,
    mountains: '#0d2040',
  },
  forest: {
    bg:        'linear-gradient(180deg, #040d08 0%, #071a0f 40%, #0a2415 100%)',
    ground:    '#051208',
    sky:       '#040d08',
    stars:     true,
    mountains: '#0d2a12',
  },
  desert: {
    bg:        'linear-gradient(180deg, #180d02 0%, #1f1205 40%, #261808 100%)',
    ground:    '#120a03',
    sky:       '#180d02',
    stars:     true,
    mountains: '#2a1a05',
  },
}

function getTheme(color: string) {
  if (color === '#00FF88' || color === '#B026FF') return WORLD_THEMES.forest
  if (color === '#FFB800' || color === '#FF3860') return WORLD_THEMES.desert
  return WORLD_THEMES.cyber
}

function StarField({ count = 40 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const x    = (i * 37 + 11) % 100
        const y    = (i * 53 + 7) % 50
        const size = i % 3 === 0 ? 2 : 1
        const delay = (i * 0.3) % 3
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            width: size, height: size,
            borderRadius: '50%',
            background: '#fff',
            opacity: 0.3 + (i % 5) * 0.1,
            animation: `star-twinkle ${2 + delay}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }} />
        )
      })}
      <style>{`
        @keyframes star-twinkle {
          0%,100% { opacity: 0.2; }
          50%      { opacity: 0.8; }
        }
      `}</style>
    </>
  )
}

function Mountains({ color, theme }: { color: string; theme: typeof WORLD_THEMES.cyber }) {
  return (
    <svg
      viewBox="0 0 800 200"
      style={{ position: 'absolute', bottom: '30%', left: 0, right: 0, width: '100%', opacity: 0.6 }}
      preserveAspectRatio="none"
    >
      <polygon points="0,200 100,80 200,140 320,40 440,120 560,30 680,100 800,60 800,200" fill={theme.mountains} />
      <polygon points="0,200 80,120 180,160 280,90 380,150 500,70 620,130 720,80 800,110 800,200" fill={theme.ground} fillOpacity="0.5" />

      {/* CIUDAD NEON al fondo */}
      <rect x="550" y="100" width="12" height="60" fill={color} fillOpacity="0.15" />
      <rect x="570" y="85" width="18" height="75" fill={color} fillOpacity="0.1" />
      <rect x="596" y="95" width="10" height="65" fill={color} fillOpacity="0.12" />
      <rect x="614" y="78" width="22" height="82" fill={color} fillOpacity="0.08" />
      <rect x="644" y="90" width="14" height="70" fill={color} fillOpacity="0.11" />

      {/* LUCES DE EDIFICIOS */}
      {[558, 576, 600, 622, 648].map((x, i) => (
        <rect key={i} x={x} y={80 + i * 5} width="2" height="2" fill={color} fillOpacity="0.8" />
      ))}
    </svg>
  )
}

export default function GoalWorld({ goal, totalSeconds, onSubGoalClick }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const subGoals   = goal.sub_goals || []
  const completed  = subGoals.filter(sg => sg.completed_at).length
  const total      = subGoals.length
  const progress   = total > 0 ? completed / total : 0
  const currentIdx = completed
  const color      = goal.color
  const theme      = getTheme(color)

  // Posiciones en la escena — camino en S
  function getNodePosition(i: number, total: number): { x: number; y: number } {
    if (total === 0) return { x: 50, y: 60 }
    const pct  = total > 1 ? i / (total - 1) : 0
    const wave = Math.sin(pct * Math.PI * 1.5) * 18
    const x    = 8 + pct * 80 + wave
    const y    = 55 + Math.cos(pct * Math.PI) * 12
    return { x: Math.max(6, Math.min(92, x)), y: Math.max(42, Math.min(72, y)) }
  }

  // Posición del avatar
  const avatarPct    = total > 1 ? currentIdx / (total - 1) : 0
  const avatarWave   = Math.sin(avatarPct * Math.PI * 1.5) * 18
  const avatarX      = 8 + avatarPct * 80 + avatarWave
  const avatarY      = 55 + Math.cos(avatarPct * Math.PI) * 12

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: '420px',
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      background: theme.bg,
      border: `1px solid ${color}22`,
    }}>

      {/* CIELO — estrellas */}
      <StarField count={50} />

      {/* AURORA / GLOW en el horizonte */}
      <div style={{
        position: 'absolute', bottom: '28%', left: '20%', right: '20%',
        height: '60px',
        background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }} />

      {/* LUNA */}
      <div style={{
        position: 'absolute', top: '8%', right: '12%',
        width: '40px', height: '40px', borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #fff8, ${color}66)`,
        boxShadow: `0 0 20px ${color}44, 0 0 40px ${color}22`,
      }} />

      {/* MONTAÑAS */}
      <Mountains color={color} theme={theme} />

      {/* SUELO */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '32%', background: theme.ground,
        borderTop: `1px solid ${color}22`,
      }}>
        {/* GRID DEL SUELO */}
        <svg width="100%" height="100%" style={{ opacity: 0.2 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i / 12) * 100}%`} x2="100%" y2={`${(i / 12) * 100}%`} stroke={color} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={`${(i / 20) * 100}%`} y1="0" x2={`${(i / 20) * 100}%`} y2="100%" stroke={color} strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* CAMINO entre nodos */}
      <svg style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', pointerEvents: 'none',
      }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {subGoals.map((sg, i) => {
          if (i === 0) return null
          const prev = getNodePosition(i - 1, total)
          const curr = getNodePosition(i, total)
          const done = !!subGoals[i - 1]?.completed_at
          return (
            <line
              key={`path-${i}`}
              x1={`${prev.x}%`} y1={`${prev.y}%`}
              x2={`${curr.x}%`} y2={`${curr.y}%`}
              stroke={done ? color : '#1F2937'}
              strokeWidth={done ? 3 : 2}
              strokeDasharray={done ? 'none' : '6 4'}
              opacity={done ? 0.8 : 0.4}
              filter={done ? 'url(#glow)' : 'none'}
            />
          )
        })}
      </svg>

      {/* NODOS DE SUBMETAS */}
      {subGoals.map((sg, i) => {
        const pos = getNodePosition(i, total)
        return (
          <SubGoalNode
            key={sg.id}
            subGoal={sg}
            index={i}
            total={total}
            color={color}
            isActive={hoveredId === sg.id}
            isCurrent={i === currentIdx && !sg.completed_at}
            xPos={pos.x}
            yPos={pos.y}
            onClick={() => onSubGoalClick(sg)}
          />
        )
      })}

      {/* META FINAL — castillo/torre al fondo */}
      <div style={{
        position: 'absolute',
        right: '4%', top: '18%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      }}>
        <div style={{ fontSize: '10px', color, letterSpacing: '1px', fontWeight: 500 }}>META</div>
        <div style={{
          width: '52px', height: '64px',
          background: `linear-gradient(180deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}55`,
          borderRadius: '4px 4px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: progress === 1
            ? `0 0 30px ${color}88, 0 0 60px ${color}44`
            : `0 0 12px ${color}33`,
        }}>
          {/* ALMENAS */}
          <div style={{ position: 'absolute', top: '-10px', left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '12px', height: '10px',
                background: `${color}44`,
                border: `1px solid ${color}55`,
                borderRadius: '2px 2px 0 0',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '24px' }}>
            {progress === 1 ? '🏆' : '🏰'}
          </span>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {goal.title}
        </div>
      </div>

      {/* AVATAR */}
      <div style={{
        position: 'absolute',
        left: `${avatarX}%`,
        top: `${avatarY - 8}%`,
        transform: 'translate(-50%, -100%)',
        transition: 'left 1s ease, top 1s ease',
        zIndex: 20,
      }}>
        <AvatarCharacter color={color} size={44} animate direction="right" />
      </div>

      {/* HUD — info overlay */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        display: 'flex', flexDirection: 'column', gap: '6px',
      }}>
        <div style={{
          background: 'rgba(10,14,26,0.85)', border: `1px solid ${color}33`,
          borderRadius: '10px', padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '3px' }}>PROGRESO</div>
          <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
            {completed}/{total}
          </div>
          <div style={{ height: '3px', background: '#1F2937', borderRadius: '3px', marginTop: '4px', width: '80px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: color, transition: 'width 1s ease' }} />
          </div>
        </div>

        <div style={{
          background: 'rgba(10,14,26,0.85)', border: `1px solid ${color}33`,
          borderRadius: '10px', padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>TIEMPO</div>
          <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
            {formatTime(totalSeconds)}
          </div>
        </div>
      </div>

      {/* MENSAJE DE VICTORIA */}
      {progress === 1 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(10,14,26,0.95)',
          border: `1px solid ${color}`,
          borderRadius: '16px', padding: '20px 28px',
          textAlign: 'center', zIndex: 30,
          boxShadow: `0 0 40px ${color}66`,
          animation: 'victory-appear 0.5s ease',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color, marginBottom: '4px' }}>¡Meta Conquistada!</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{goal.title}</div>
          <style>{`@keyframes victory-appear { from { transform: translate(-50%,-50%) scale(0.8); opacity:0; } to { transform: translate(-50%,-50%) scale(1); opacity:1; } }`}</style>
        </div>
      )}
    </div>
  )
}