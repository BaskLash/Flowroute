import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { ImpactSection } from "@/components/landing/impact-section"
import { RealitySection } from "@/components/landing/reality-section"
import { ProblemsSection } from "@/components/landing/problems-section"
import { SolutionSection } from "@/components/landing/solution-section"
import { UseCasesSection } from "@/components/landing/use-cases-section"
import { FutureSection } from "@/components/landing/future-section"
import { BlogPreviewSection } from "@/components/landing/blog-preview-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { AnalyticsTracker } from "@/components/landing/analytics-tracker"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <ImpactSection />
      <RealitySection />
      <ProblemsSection />
      <SolutionSection />
      <UseCasesSection />
      <FutureSection />
      <BlogPreviewSection />
      <CTASection />
      <Footer />
      <AnalyticsTracker />
    </main>
  )
}
