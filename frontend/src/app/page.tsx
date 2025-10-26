import LandingLayout from '@/components/landing/LandingLayout';
import Hero from '@/components/landing/Hero';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import CTA from '@/components/landing/CTA';

export default function Home() {
  return (
    <LandingLayout>
      <div className="min-h-screen">
        <Hero />
        <HowItWorks />
        <Features />
        <Pricing />
        <CTA />
      </div>
    </LandingLayout>
  );
}
