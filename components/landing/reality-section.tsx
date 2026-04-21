"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { Clock, Calendar, AlertTriangle } from "lucide-react"
import { useSectionView } from "@/hooks/use-section-view"

export function RealitySection() {
  const ref = useSectionView<HTMLElement>("reality")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const stats = [
    {
      icon: Clock,
      value: "30–60",
      unit: "min/day",
      label: "The average commuter loses in traffic",
    },
    {
      icon: Calendar,
      value: "5+",
      unit: "hrs/week",
      label: "Wasted sitting in your car",
    },
    {
      icon: AlertTriangle,
      value: "250+",
      unit: "hrs/year",
      label: "More than 10 full days — gone",
    },
  ]

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8" id="features">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            The reality of your commute
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {"Not because of distance. But because of timing."}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-colors hover:border-primary/50"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-all group-hover:scale-150" />
              <stat.icon className="relative h-10 w-10 text-primary" />
              <div className="relative mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{stat.value}</span>
                  <span className="text-lg text-muted-foreground">{stat.unit}</span>
                </div>
                <p className="mt-2 text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
