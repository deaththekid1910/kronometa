/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  turbopack: {},
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig