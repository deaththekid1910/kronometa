export interface Greeting {
  saludo: string
  emoji: string
  gradient: string
  accent: string
  frase: string
  particles: string[]
}

export function getGreeting(date: Date = new Date()): Greeting {
  const hour = date.getHours()

  if (hour < 6) {
    return {
      saludo: 'Buenas madrugadas',
      emoji: '🌙',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
      accent: '#818CF8',
      frase: 'Trabajando cuando otros descansan. Esa es la ventaja.',
      particles: ['🌙', '⭐', '✨', '🌌'],
    }
  }
  if (hour < 12) {
    return {
      saludo: 'Buenos días',
      emoji: '☀️',
      gradient: 'linear-gradient(135deg, #78350F 0%, #B45309 45%, #F59E0B 100%)',
      accent: '#FBBF24',
      frase: 'Hoy es un buen día para conquistar tus metas.',
      particles: ['☀️', '🌅', '☕', '🌻'],
    }
  }
  if (hour < 19) {
    return {
      saludo: 'Buenas tardes',
      emoji: '🌤️',
      gradient: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 45%, #FB923C 100%)',
      accent: '#F97316',
      frase: 'Mantén el ritmo, ya recorriste la mitad del camino.',
      particles: ['🌤️', '⚡', '🔥', '💪'],
    }
  }
  return {
    saludo: 'Buenas noches',
    emoji: '🌆',
    gradient: 'linear-gradient(135deg, #1E1B4B 0%, #3730A3 50%, #6366F1 100%)',
    accent: '#A78BFA',
    frase: 'Cierra el día con broche de oro. Uno más cerca de tus metas.',
    particles: ['🌆', '🌃', '⭐', '🌙'],
  }
}
