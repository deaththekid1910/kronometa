// Genera sonidos neon con Web Audio API — sin archivos externos
let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  delay = 0
) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type      = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

    gain.gain.setValueAtTime(0, ctx.currentTime + delay)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration + 0.05)
  } catch {}
}

// 🔔 Notificación general — dos tonos suaves
export function playNotificationSound() {
  playTone(880, 0.15, 'sine', 0.2, 0)
  playTone(1100, 0.2, 'sine', 0.15, 0.15)
}

// ⚡ Alerta urgente (vencimiento hoy/vencido) — tono de alerta
export function playUrgentSound() {
  playTone(440, 0.1, 'square', 0.15, 0)
  playTone(380, 0.1, 'square', 0.15, 0.12)
  playTone(440, 0.15, 'square', 0.15, 0.24)
}

// 🏆 Logro desbloqueado — fanfare corto neon
export function playAchievementSound() {
  playTone(523, 0.12, 'sine', 0.2, 0)
  playTone(659, 0.12, 'sine', 0.2, 0.1)
  playTone(784, 0.12, 'sine', 0.2, 0.2)
  playTone(1047, 0.3,  'sine', 0.25, 0.32)
}

// ⭐ Subida de nivel — ascenso épico
export function playLevelUpSound() {
  playTone(392,  0.1, 'sine', 0.2, 0)
  playTone(494,  0.1, 'sine', 0.2, 0.1)
  playTone(587,  0.1, 'sine', 0.2, 0.2)
  playTone(698,  0.1, 'sine', 0.2, 0.3)
  playTone(880,  0.15,'sine', 0.22, 0.4)
  playTone(1175, 0.4, 'sine', 0.25, 0.55)
}

// ✅ Submeta completada — tick satisfactorio
export function playCompleteSound() {
  playTone(800,  0.08, 'sine', 0.18, 0)
  playTone(1200, 0.15, 'sine', 0.18, 0.08)
}

// 🔄 Tarea recurrente pendiente — pulso doble
export function playReminderSound() {
  playTone(660, 0.12, 'sine', 0.18, 0)
  playTone(660, 0.12, 'sine', 0.18, 0.25)
}