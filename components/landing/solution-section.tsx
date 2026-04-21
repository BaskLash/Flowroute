"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { MapPin, Clock, Zap } from "lucide-react"
import { useSectionView } from "@/hooks/use-section-view"

export function SolutionSection() {
  const ref = useSectionView<HTMLElement>("solution")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      icon: MapPin,
      step: "01",
      title: "Enter origin & destination",
      description: "Simply tell us where you're going from and to.",
    },
    {
      icon: Clock,
      step: "02",
      title: "Set optional time window",
      description: "Define when you can leave — morning, evening, or anytime.",
    },
    {
      icon: Zap,
      step: "03",
      title: "Get optimal departure times",
      description: "Instantly compare departure times and see the best option.",
    },
  ]

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8" id="how-it-works">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            The Solution
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {"flowroute analyzes traffic patterns"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {"And tells you exactly when to leave."}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="absolute top-12 left-full hidden h-0.5 w-full bg-gradient-to-r from-border to-transparent lg:block" />
              )}
              <div className="rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-border">{step.step}</span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
