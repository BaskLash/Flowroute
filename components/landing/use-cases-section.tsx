"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { Briefcase, Car, Building2 } from "lucide-react"
import { useSectionView } from "@/hooks/use-section-view"

export function UseCasesSection() {
  const ref = useSectionView<HTMLElement>("use_cases")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const useCases = [
    {
      icon: Building2,
      title: "Office Workers",
      tagline: "Shift your departure slightly. Save hours weekly.",
      description:
        "Flexible schedules mean flexible departures. Even a 15-minute shift in your leave time can dramatically reduce your commute.",
    },
    {
      icon: Car,
      title: "Field Workers",
      tagline: "Reach more clients. Reduce wasted travel time.",
      description:
        "Sales reps, service technicians, and delivery drivers can optimize routes between appointments and get more done in less time.",
    },
    {
      icon: Briefcase,
      title: "Daily Commuters",
      tagline: "Stop guessing. Start optimizing.",
      description:
        "Whether you're driving to the office or picking up kids from school, make every trip as efficient as possible.",
    },
  ]

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Built for everyone who drives
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {"No matter your schedule, flowroute helps you save time."}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm transition-all hover:border-primary/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                  <useCase.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{useCase.title}</h3>
                <p className="mt-2 font-medium text-primary">{useCase.tagline}</p>
                <p className="mt-3 text-muted-foreground leading-relaxed">{useCase.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
