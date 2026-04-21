"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { Users, TrendingUp, Clock, Eye } from "lucide-react"
import { useSectionView } from "@/hooks/use-section-view"

export function ProblemsSection() {
  const ref = useSectionView<HTMLElement>("problems")
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const problems = [
    {
      icon: Users,
      title: "You leave when everyone leaves",
      description:
        "Rush hour exists because everyone follows the same schedule. When you leave at the same time as everyone else, you become part of the problem.",
    },
    {
      icon: TrendingUp,
      title: "Traffic isn't random — it's predictable",
      description:
        "Traffic patterns repeat daily. The same routes get congested at the same times. This predictability is actually your biggest advantage.",
    },
    {
      icon: Clock,
      title: "You think you're saving time — but you're not",
      description:
        "Leaving earlier doesn't always mean arriving earlier. Sometimes leaving later gets you there faster. Without data, you're just guessing.",
    },
    {
      icon: Eye,
      title: "You're losing time without realizing it",
      description:
        "30 minutes lost daily doesn't feel like much. But over a year, it adds up to weeks of your life spent sitting in traffic.",
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
            Why this keeps happening
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {"Understanding the problem is the first step to solving it."}
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group flex gap-4 rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-card/70"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 transition-colors group-hover:bg-accent/20">
                <problem.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">{problem.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
