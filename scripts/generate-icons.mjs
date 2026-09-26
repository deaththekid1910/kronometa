// Genera todos los iconos y logos de KronoMeta a partir del logo oficial
// (scripts/kronometa-logo.jpg, 2000x2000). Ejecutar: node scripts/generate-icons.mjs
import { createCanvas, loadImage } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SOURCE = join('scripts', 'kronometa-logo.jpg')
const BG     = '#0B0F1C'   // fondo del logo (para rellenos y maskable)

// Zonas del logo original (coordenadas sobre 2000x2000)
const EMBLEM = { cx: 1000, cy: 858, side: 1380 }   // círculo completo con runas
const INNER  = { cx: 1000, cy: 870, side: 820 }    // solo la "K" central: legible a 16-48px

const img = await loadImage(SOURCE)

function render(size, area, { scale = 1, rounded = false } = {}) {
  const c   = createCanvas(size, size)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, size, size)
  const inner = size * scale
  const off   = (size - inner) / 2
  ctx.drawImage(img, area.cx - area.side / 2, area.cy - area.side / 2, area.side, area.side, off, off, inner, inner)
  if (rounded) {
    // recorta en círculo (para el logo dentro de la interfaz)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  return c.toBuffer('image/png')
}

// Contenedor .ico con imágenes PNG embebidas (soportado por todos los navegadores)
function toIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(pngs.length, 4)
  const dir = Buffer.alloc(16 * pngs.length)
  let offset = 6 + dir.length
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(offset, o + 12)
    offset += buf.length
  })
  return Buffer.concat([header, dir, ...pngs.map(p => p.buf)])
}

function save(path, buf) {
  writeFileSync(path, buf)
  console.log(`✓ ${path}`)
}

mkdirSync(join('public', 'icons'), { recursive: true })
mkdirSync(join('public', 'brand'), { recursive: true })

// 1. Iconos de la PWA (instalación en PC / Android) — emblema completo
for (const size of [72, 96, 128, 144, 152, 180, 192, 384, 512]) {
  save(join('public', 'icons', `icon-${size}x${size}.png`), render(size, EMBLEM))
}

// 2. Maskable: el emblema dentro de la zona segura (80%) para máscaras circulares
save(join('public', 'icons', 'manifest-icon-192.maskable.png'), render(192, EMBLEM, { scale: 0.8 }))
save(join('public', 'icons', 'manifest-icon-512.maskable.png'), render(512, EMBLEM, { scale: 0.8 }))

// 3. Apple touch icon (iOS redondea las esquinas por su cuenta)
save(join('public', 'icons', 'apple-icon-180.png'), render(180, EMBLEM))

// 4. Favicon de la pestaña: la "K" central, que es lo que se distingue a 16-48px
const fav = [16, 32, 48].map(size => ({ size, buf: render(size, INNER) }))
save(join('src', 'app', 'favicon.ico'), toIco(fav))
save(join('public', 'icons', 'favicon-32x32.png'), fav[1].buf)
save(join('public', 'icons', 'favicon-16x16.png'), fav[0].buf)

// 5. Logos para la interfaz
save(join('public', 'brand', 'emblem.png'), render(128, INNER, { rounded: true }))   // marca pequeña (sidebar, navbar)
{
  // Logo completo con el texto "KronoMeta · Goals · Habits · Time"
  const size = 800
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, size, size)
  save(join('public', 'brand', 'logo-full.jpg'), c.toBuffer('image/jpeg', { quality: 0.88 }))
}

console.log('\n✅ Iconos y logos generados')
