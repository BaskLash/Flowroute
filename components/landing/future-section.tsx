"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Calendar, Navigation, Bell, Brain, Building } from "lucide-react"

export function FutureSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const features = [
    { icon: Calendar, label: "Calendar integration" },
    { icon: Navigation, label: "Multi-stop optimization" },
    { icon: Bell, label: "Smart notifications" },
    { icon: Brain, label: "AI traffic prediction" },
    { icon: Building, label: "Business fleet dashboards" },
  ]

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
            {"We're building the future of smart commuting."}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
