import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const cx     = size / 2
  const cy     = size / 2
  const r      = size * 0.16

  // FONDO con esquinas redondeadas
  ctx.beginPath()
  ctx.moveTo(r, 0)
  ctx.lineTo(size - r, 0)
  ctx.quadraticCurveTo(size, 0, size, r)
  ctx.lineTo(size, size - r)
  ctx.quadraticCurveTo(size, size, size - r, size)
  ctx.lineTo(r, size)
  ctx.quadraticCurveTo(0, size, 0, size - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
  ctx.fillStyle = '#0A0E1A'
  ctx.fill()

  // GRADIENTE radial de fondo
  const grad = ctx.createRadialGradient(cx * 0.6, cy * 0.6, 0, cx, cy, size * 0.7)
  grad.addColorStop(0, 'rgba(0,245,255,0.18)')
  grad.addColorStop(1, 'rgba(10,14,26,0)')
  ctx.fillStyle = grad
  ctx.fill()

  // HEXÁGONO
  const hexR   = size * 0.28
  const hexTop = cy * 0.55
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = cx + hexR * Math.cos(angle)
    const y = hexTop + hexR * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = '#00F5FF'
  ctx.lineWidth   = size * 0.025
  ctx.shadowColor = '#00F5FF'
  ctx.shadowBlur  = size * 0.06
  ctx.stroke()
  ctx.shadowBlur  = 0

  // ESTRELLA dentro del hexágono
  ctx.font      = `bold ${size * 0.2}px Arial`
  ctx.fillStyle = '#00F5FF'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#00F5FF'
  ctx.shadowBlur  = size * 0.05
  ctx.fillText('★', cx, hexTop + size * 0.08)
  ctx.shadowBlur  = 0

  // TEXTO KM
  ctx.font        = `700 ${size * 0.14}px Arial`
  ctx.fillStyle   = '#F1F5F9'
  ctx.shadowColor = 'transparent'
  ctx.fillText('KM', cx, cy * 1.52)

  // BARRA DE PROGRESO
  const barY  = size * 0.81
  const barX  = size * 0.2
  const barW  = size * 0.6
  const barH  = size * 0.04
  const barRx = barH / 2

  // fondo barra
  ctx.beginPath()
  ctx.roundRect(barX, barY, barW, barH, barRx)
  ctx.fillStyle = '#1F2937'
  ctx.fill()

  // relleno barra (62%)
  const fillW = barW * 0.62
  ctx.beginPath()
  ctx.roundRect(barX, barY, fillW, barH, barRx)
  const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0)
  barGrad.addColorStop(0, '#00F5FF88')
  barGrad.addColorStop(1, '#00F5FF')
  ctx.fillStyle   = barGrad
  ctx.shadowColor = '#00F5FF'
  ctx.shadowBlur  = size * 0.03
  ctx.fill()
  ctx.shadowBlur  = 0

  // punto avatar en la barra
  const dotX = barX + fillW
  const dotY = barY + barH / 2
  const dotR = size * 0.035
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2)
  ctx.fillStyle   = '#00F5FF'
  ctx.shadowColor = '#00F5FF'
  ctx.shadowBlur  = size * 0.04
  ctx.fill()
  ctx.shadowBlur  = 0

  return canvas.toBuffer('image/png')
}

mkdirSync('public/icons', { recursive: true })

for (const size of sizes) {
  try {
    const buffer = generateIcon(size)
    const path   = join('public', 'icons', `icon-${size}x${size}.png`)
    writeFileSync(path, buffer)
    console.log(`✓ icon-${size}x${size}.png`)
  } catch (e) {
    console.error(`✗ icon-${size}x${size}.png — ${e.message}`)
  }
}

// Apple touch icon
writeFileSync(join('public', 'icons', 'apple-icon-180.png'), generateIcon(180))
console.log('✓ apple-icon-180.png')

console.log('\n✅ Todos los iconos PNG generados en public/icons/')