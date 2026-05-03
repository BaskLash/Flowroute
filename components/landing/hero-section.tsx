"use client"

import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import { RoutePlanner } from "@/components/traffic/route-planner"
import { useSectionView } from "@/hooks/use-section-view"

export function HeroSection() {
  const ref = useSectionView<HTMLElement>("hero")

  return (
    <section
      ref={ref}
      id="demo"
      className="relative overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8 lg:pt-36 lg:pb-24"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-2 text-sm"
          >
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Save 200+ hours per year</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            {"You're not stuck in traffic."}
            <br />
            <span className="text-primary">{"You're leaving at the wrong time."}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
          >
            {"Enter where you're going, and we'll tell you exactly when to leave."}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mx-auto mt-8 max-w-2xl sm:mt-10"
        >
          <RoutePlanner />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
        >
          {[
            { value: "30+", label: "min saved per trip" },
            { value: "200+", label: "hours saved yearly" },
            { value: "0", label: "learning curve" },
            { value: "<5s", label: "to get results" },
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/50 bg-card/50 p-4 text-center backdrop-blur-sm sm:p-6"
            >
              <div className="text-2xl font-bold text-primary sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
