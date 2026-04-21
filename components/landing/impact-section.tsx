"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useSectionView } from "@/hooks/use-section-view"

export function ImpactSection() {
  const ref = useSectionView<HTMLElement>("impact")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const lines = [
    "You leave at 17:00.",
    "So does everyone else.",
    "The road fills.",
    "Time disappears.",
  ]

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="space-y-4 text-center">
          {lines.map((line, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="text-2xl font-medium text-muted-foreground sm:text-3xl lg:text-4xl"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-16 rounded-2xl border border-border/50 bg-card/50 p-8 text-center backdrop-blur-sm sm:p-12"
        >
          <p className="text-xl font-semibold text-foreground sm:text-2xl">
            {"It happens every day."}
          </p>
          <p className="mt-2 text-2xl font-bold text-primary sm:text-3xl">
            {"And it's avoidable."}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
