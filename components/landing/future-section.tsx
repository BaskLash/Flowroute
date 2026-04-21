"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { Calendar, Navigation, Bell, Brain, Building } from "lucide-react"
import { useSectionView } from "@/hooks/use-section-view"
import {
  trackFutureFeatureInterest,
  type FutureFeatureId,
} from "@/lib/analytics"

type FutureFeature = {
  id: FutureFeatureId
  icon: typeof Calendar
  label: string
}

const FEATURES: FutureFeature[] = [
  { id: "calendar_integration", icon: Calendar, label: "Calendar integration" },
  { id: "multi_stop_optimization", icon: Navigation, label: "Multi-stop optimization" },
  { id: "smart_notifications", icon: Bell, label: "Smart notifications" },
  { id: "ai_traffic_prediction", icon: Brain, label: "AI traffic prediction" },
  { id: "business_fleet_dashboards", icon: Building, label: "Business fleet dashboards" },
]

export function FutureSection() {
  const ref = useSectionView<HTMLElement>("future")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm sm:p-12"
        >
          <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-muted-foreground">
            Coming Soon
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {"flowroute is just getting started"}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {"We're building the future of smart commuting. Tap a feature to let us know you'd use it."}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {FEATURES.map((feature, index) => (
              <motion.button
                key={feature.id}
                type="button"
                onClick={() => trackFutureFeatureInterest(feature.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 transition-colors hover:border-primary/40 hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Signal interest in ${feature.label}`}
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
