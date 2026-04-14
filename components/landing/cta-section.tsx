"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-4xl rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/50 to-card/50 p-8 text-center backdrop-blur-sm sm:p-12 lg:p-16"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Stop wasting time in traffic.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {"You don't need to drive less. You just need to leave smarter."}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="group w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
            asChild
          >
            <Link href="#demo">
              Check My Route
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-primary/30 hover:bg-primary/10 sm:w-auto"
            asChild
          >
            <Link href="#demo">Start Saving Time</Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span>Save up to 200+ hours per year</span>
          <span className="hidden sm:inline">•</span>
          <span>Instant traffic insights</span>
          <span className="hidden sm:inline">•</span>
          <span>No learning curve</span>
        </div>
      </motion.div>
    </section>
  )
}
