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

const WORLD_THEMES = {
  cyber: {
    bg:        'linear-gradient(180deg, #020818 0%, #050d1f 40%, #0a1628 100%)',
    ground:    '#051020',
    mountains: '#0d2040',
  },
  forest: {
    bg:        'linear-gradient(180deg, #040d08 0%, #071a0f 40%, #0a2415 100%)',
    ground:    '#051208',
    mountains: '#0d2a12',
  },
  desert: {
    bg:        'linear-gradient(180deg, #180d02 0%, #1f1205 40%, #261808 100%)',
    ground:    '#120a03',
    mountains: '#2a1a05',
  },
}

function getTheme(color: string) {
  if (color === '#00FF88' || color === '#B026FF') return WORLD_THEMES.forest
  if (color === '#FFB800' || color === '#FF3860') return WORLD_THEMES.desert
  return WORLD_THEMES.cyber
}

function StarField() {
  return (
    <>
      {Array.from({ length: 50 }).map((_, i) => {
        const x     = (i * 37 + 11) % 100
        const y     = (i * 53 + 7)  % 48
        const size  = i % 3 === 0 ? 2 : 1
        const delay = (i * 0.3) % 3
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            width: size, height: size, borderRadius: '50%',
            background: '#fff', opacity: 0.2 + (i % 5) * 0.08,
            animation: `star-twinkle ${2 + delay}s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }} />
        )
      })}
      <style>{`@keyframes star-twinkle{0%,100%{opacity:.2}50%{opacity:.8}}`}</style>
    </>
  )
}

function Mountains({ color, theme }: { color: string; theme: typeof WORLD_THEMES.cyber }) {
  return (
    <svg viewBox="0 0 800 200" style={{ position: 'absolute', bottom: '30%', left: 0, width: '100%', opacity: 0.6 }} preserveAspectRatio="none">
      <polygon points="0,200 100,80 200,140 320,40 440,120 560,30 680,100 800,60 800,200" fill={theme.mountains} />
      <polygon points="0,200 80,120 180,160 280,90 380,150 500,70 620,130 720,80 800,110 800,200" fill={theme.ground} fillOpacity="0.5" />
      {/* Ciudad neon */}
      {[550,570,596,614,644].map((x, i) => (
        <rect key={i} x={x} y={85 + i * 3} width={i % 2 === 0 ? 12 : 18} height={75 - i * 3} fill={color} fillOpacity="0.1" />
      ))}
      {[558,576,600,622,648].map((x, i) => (
        <rect key={i} x={x} y={80 + i * 5} width="2" height="2" fill={color} fillOpacity="0.8" />
      ))}
    </svg>
  )
}

// Punto de inicio — posición fija a la izquierda
const START_X = 6
const START_Y = 60

function getNodePosition(i: number, total: number): { x: number; y: number } {
  if (total === 0) return { x: 50, y: 60 }
  // Empieza desde el 15% para dejar espacio al punto de inicio
  const pct  = total > 1 ? i / (total - 1) : 0
  const x    = 18 + pct * 68
  const wave = Math.sin(pct * Math.PI * 1.5) * 14
  const y    = 57 + wave
  return { x: Math.max(15, Math.min(90, x)), y: Math.max(42, Math.min(72, y)) }
}

// Posición del avatar según progreso
function getAvatarPosition(currentIdx: number, total: number, subGoals: SubGoal[]): { x: number; y: number } {
  const allDone = total > 0 && subGoals.every(sg => sg.completed_at)

  // Victoria — encima del castillo
  if (allDone) return { x: 88, y: 14 }

  // Punto de inicio si no ha completado nada
  if (currentIdx === 0) return { x: START_X, y: START_Y }

  // Posición de la última submeta completada
  const pos = getNodePosition(currentIdx - 1, total)
  return { x: pos.x, y: pos.y }
}

export default function GoalWorld({ goal, totalSeconds, onSubGoalClick }: Props) {
  const subGoals  = goal.sub_goals || []
  const completed = subGoals.filter(sg => sg.completed_at).length
  const total     = subGoals.length
  const progress  = total > 0 ? completed / total : 0
  const allDone   = total > 0 && completed === total
  const color     = goal.color
  const theme     = getTheme(color)

  const avatarPos = getAvatarPosition(completed, total, subGoals)

  return (
    <div style={{
      width: '100%', height: '100%', minHeight: '420px',
      position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
      background: theme.bg,
      border: `1px solid ${color}22`,
    }}>
      <style>{`
        @keyframes victory-bounce {
          0%,100% { transform: translate(-50%,-100%) scale(1) rotate(0deg); }
          25%      { transform: translate(-50%,-110%) scale(1.1) rotate(-8deg); }
          75%      { transform: translate(-50%,-110%) scale(1.1) rotate(8deg); }
        }
        @keyframes victory-appear {
          from { transform: translate(-50%,-50%) scale(0.7); opacity:0; }
          to   { transform: translate(-50%,-50%) scale(1);   opacity:1; }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity:1; }
          100% { transform: translateY(60px)  rotate(360deg); opacity:0; }
        }
        @keyframes node-pulse {
          0%,100% { box-shadow: 0 0 20px ${color}66, 0 0 40px ${color}22; }
          50%      { box-shadow: 0 0 30px ${color}99, 0 0 60px ${color}44; }
        }
        @keyframes start-glow {
          0%,100% { box-shadow: 0 0 10px ${color}44; }
          50%      { box-shadow: 0 0 20px ${color}88; }
        }
      `}</style>

      {/* FONDO */}
      <StarField />

      {/* AURORA */}
      <div style={{
        position: 'absolute', bottom: '28%', left: '20%', right: '20%', height: '60px',
        background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
        filter: 'blur(20px)',
      }} />

      {/* LUNA */}
      <div style={{
        position: 'absolute', top: '6%', right: '10%',
        width: '38px', height: '38px', borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #fff8, ${color}66)`,
        boxShadow: `0 0 20px ${color}44`,
      }} />

      <Mountains color={color} theme={theme} />

      {/* SUELO */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '32%',
        background: theme.ground, borderTop: `1px solid ${color}22`,
      }}>
        <svg width="100%" height="100%" style={{ opacity: 0.15 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i / 10) * 100}%`} x2="100%" y2={`${(i / 10) * 100}%`} stroke={color} strokeWidth="0.5" />
          ))}
          {Array.from({ length: 18 }).map((_, i) => (
            <line key={`v${i}`} x1={`${(i / 18) * 100}%`} y1="0" x2={`${(i / 18) * 100}%`} y2="100%" stroke={color} strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* CAMINO SVG */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <filter id={`glow-${goal.id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Línea desde START al primer nodo */}
        {subGoals.length > 0 && (() => {
          const first = getNodePosition(0, total)
          return (
            <line
              x1={`${START_X}%`} y1={`${START_Y}%`}
              x2={`${first.x}%`} y2={`${first.y}%`}
              stroke={completed > 0 ? color : '#1F2937'}
              strokeWidth={completed > 0 ? 3 : 2}
              strokeDasharray={completed > 0 ? 'none' : '6 4'}
              opacity={completed > 0 ? 0.8 : 0.35}
              filter={completed > 0 ? `url(#glow-${goal.id})` : 'none'}
            />
          )
        })()}

        {/* Líneas entre nodos */}
        {subGoals.map((sg, i) => {
          if (i === 0) return null
          const prev = getNodePosition(i - 1, total)
          const curr = getNodePosition(i, total)
          const done = !!subGoals[i - 1]?.completed_at
          return (
            <line key={`path-${i}`}
              x1={`${prev.x}%`} y1={`${prev.y}%`}
              x2={`${curr.x}%`} y2={`${curr.y}%`}
              stroke={done ? color : '#1F2937'}
              strokeWidth={done ? 3 : 2}
              strokeDasharray={done ? 'none' : '6 4'}
              opacity={done ? 0.8 : 0.35}
              filter={done ? `url(#glow-${goal.id})` : 'none'}
            />
          )
        })}

        {/* Línea del último nodo al castillo si todo completo */}
        {allDone && subGoals.length > 0 && (() => {
          const last = getNodePosition(total - 1, total)
          return (
            <line
              x1={`${last.x}%`} y1={`${last.y}%`}
              x2="88%" y2="30%"
              stroke={color} strokeWidth={3}
              opacity={0.8}
              filter={`url(#glow-${goal.id})`}
            />
          )
        })()}
      </svg>

      {/* PUNTO DE INICIO */}
      <div style={{
        position: 'absolute',
        left: `${START_X}%`, top: `${START_Y}%`,
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        zIndex: 4,
      }}>
        <div style={{ fontSize: '9px', color, letterSpacing: '1px', fontWeight: 500 }}>INICIO</div>
        <div style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: `${color}22`, border: `2px solid ${color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', animation: 'start-glow 2s ease-in-out infinite',
        }}>🚩</div>
      </div>

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
            isActive={false}
            isCurrent={i === completed && !sg.completed_at}
            xPos={pos.x}
            yPos={pos.y}
            onClick={() => onSubGoalClick(sg)}
          />
        )
      })}

      {/* META FINAL — CASTILLO */}
      <div style={{
        position: 'absolute', right: '4%', top: '12%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        zIndex: allDone ? 25 : 5,
      }}>
        <div style={{ fontSize: '9px', color, letterSpacing: '1px', fontWeight: 500 }}>META</div>
        <div style={{
          width: '56px', height: '68px',
          background: `linear-gradient(180deg, ${color}${allDone ? '55' : '22'}, ${color}11)`,
          border: `1px solid ${color}${allDone ? '88' : '44'}`,
          borderRadius: '4px 4px 0 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          boxShadow: allDone
            ? `0 0 40px ${color}cc, 0 0 80px ${color}66`
            : `0 0 12px ${color}33`,
          transition: 'all 1s ease',
        }}>
          {/* ALMENAS */}
          <div style={{ position: 'absolute', top: '-12px', left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: '13px', height: '12px',
                background: `${color}${allDone ? '66' : '33'}`,
                border: `1px solid ${color}${allDone ? '88' : '44'}`,
                borderRadius: '2px 2px 0 0',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '26px' }}>{allDone ? '🏆' : '🏰'}</span>
        </div>
        <div style={{
          fontSize: '9px', color: 'var(--muted)', textAlign: 'center',
          maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {goal.title}
        </div>
      </div>

      {/* AVATAR */}
      <div style={{
        position: 'absolute',
        left: `${avatarPos.x}%`,
        top: `${avatarPos.y}%`,
        transform: 'translate(-50%, -100%)',
        transition: 'left 1.2s cubic-bezier(0.34,1.56,0.64,1), top 1.2s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 20,
        animation: allDone ? 'victory-bounce 0.8s ease-in-out infinite' : 'none',
      }}>
        <AvatarCharacter
          color={color}
          size={allDone ? 52 : 44}
          animate={!allDone}
          direction="right"
        />
      </div>

      {/* CONFETI DE VICTORIA */}
      {allDone && Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${72 + (i % 6) * 5}%`,
          top: `${8 + Math.floor(i / 6) * 8}%`,
          width: '6px', height: '6px',
          borderRadius: i % 3 === 0 ? '50%' : '1px',
          background: [color, '#FFB800', '#00FF88', '#B026FF', '#FF3860', '#fff'][i % 6],
          animation: `confetti-fall ${1 + (i % 3) * 0.4}s ease-in ${(i * 0.15)}s infinite`,
        }} />
      ))}

      {/* PANEL VICTORIA */}
      {allDone && (
        <div style={{
          position: 'absolute', top: '50%', left: '40%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(10,14,26,0.96)',
          border: `1px solid ${color}`,
          borderRadius: '16px', padding: '20px 24px',
          textAlign: 'center', zIndex: 30,
          boxShadow: `0 0 60px ${color}66, 0 0 120px ${color}33`,
          animation: 'victory-appear 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          minWidth: '180px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px',
            animation: 'victory-bounce 0.8s ease-in-out infinite',
            display: 'inline-block',
          }}>🏆</div>
          <div style={{
            fontSize: '15px', fontWeight: 700, color,
            marginBottom: '4px', letterSpacing: '0.5px',
          }}>¡Lo lograste!</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
            {goal.title}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <div style={{
              background: color + '15', border: `1px solid ${color}33`,
              borderRadius: '8px', padding: '6px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--muted)' }}>SUBMETAS</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                {total}/{total}
              </div>
            </div>
            <div style={{
              background: '#FFB80015', border: '1px solid #FFB80033',
              borderRadius: '8px', padding: '6px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '9px', color: 'var(--muted)' }}>TIEMPO</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                {formatTime(totalSeconds)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HUD */}
      <div style={{
        position: 'absolute', top: '12px', left: '12px',
        display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 15,
      }}>
        <div style={{
          background: 'rgba(10,14,26,0.85)', border: `1px solid ${color}33`,
          borderRadius: '10px', padding: '8px 12px', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '3px' }}>PROGRESO</div>
          <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
            {completed}/{total}
          </div>
          <div style={{ height: '3px', background: '#1F2937', borderRadius: '3px', marginTop: '4px', width: '72px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress * 100}%`, background: color, transition: 'width 1s ease', boxShadow: `0 0 6px ${color}` }} />
          </div>
        </div>
        <div style={{
          background: 'rgba(10,14,26,0.85)', border: `1px solid #FFB80033`,
          borderRadius: '10px', padding: '8px 12px', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '2px' }}>TIEMPO</div>
          <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
            {formatTime(totalSeconds)}
          </div>
        </div>
      </div>
    </div>
  )
}