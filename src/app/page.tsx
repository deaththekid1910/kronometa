import Navbar          from '@/components/landing/Navbar'
import HeroSection     from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import StatsSection    from '@/components/landing/StatsSection'
import CTASection      from '@/components/landing/CTASection'

export default function LandingPage() {
  return (
    <main style={{ background: '#0A0E1A', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CTASection />
    </main>
  )
}