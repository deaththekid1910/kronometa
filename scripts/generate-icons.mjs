// scripts/generate-icons.mjs
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

function generateSVG(size) {
  const r = size * 0.16
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0A0E1A"/>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <defs>
    <radialGradient id="bg" cx="30%" cy="30%">
      <stop offset="0%" stop-color="#00F5FF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#0A0E1A" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <polygon
    points="${size*0.5},${size*0.15} ${size*0.66},${size*0.25} ${size*0.66},${size*0.45} ${size*0.5},${size*0.55} ${size*0.34},${size*0.45} ${size*0.34},${size*0.25}"
    fill="none" stroke="#00F5FF" stroke-width="${size*0.025}"
    opacity="0.9"
  />
  <text x="${size*0.5}" y="${size*0.44}" text-anchor="middle"
    font-size="${size*0.18}" font-family="Arial" font-weight="700"
    fill="#00F5FF">★</text>
  <text x="${size*0.5}" y="${size*0.72}" text-anchor="middle"
    font-size="${size*0.14}" font-family="Arial" font-weight="700"
    fill="#F1F5F9" letter-spacing="-1">KM</text>
  <rect x="${size*0.22}" y="${size*0.8}" width="${size*0.56}" height="${size*0.035}" rx="${size*0.018}" fill="#1F2937"/>
  <rect x="${size*0.22}" y="${size*0.8}" width="${size*0.35}" height="${size*0.035}" rx="${size*0.018}" fill="#00F5FF" opacity="0.9"/>
  <circle cx="${size*0.57}" cy="${size*0.817}" r="${size*0.028}" fill="#00F5FF"/>
</svg>`
}

mkdirSync('public/icons', { recursive: true })

for (const size of sizes) {
  const svg = generateSVG(size)
  writeFileSync(join('public', 'icons', `icon-${size}x${size}.svg`), svg)
  console.log(`✓ icon-${size}x${size}.svg`)
}

// Apple touch icon
writeFileSync(join('public', 'icons', 'apple-icon-180.svg'), generateSVG(180))
console.log('✓ apple-icon-180.svg')

console.log('\n✅ Iconos SVG generados en public/icons/')
console.log('ℹ️  Para producción, convierte a PNG con una herramienta online como https://cloudconvert.com/svg-to-png')