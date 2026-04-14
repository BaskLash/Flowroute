"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { MapPin, Clock, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DemoSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [showResults, setShowResults] = useState(false)

  const results = [
    { time: "17:00", duration: "55 min", status: "peak" },
    { time: "17:18", duration: "42 min", status: "moderate" },
    { time: "17:42", duration: "37 min", status: "optimal" },
    { time: "18:00", duration: "40 min", status: "moderate" },
  ]

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8" id="demo">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            See It In Action
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Try the time comparison
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {"See how different departure times affect your commute."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm sm:p-8">
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="From: Home, Office, Address..."
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="123 Main Street"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  type="text"
                  placeholder="To: Work, Destination..."
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="456 Business Park"
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Time window (optional): 5pm - 7pm"
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="5:00 PM - 6:30 PM"
                />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                onClick={() => setShowResults(true)}
              >
                Compare Departure Times
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {showResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.4 }}
                className="mt-8 border-t border-border/50 pt-8"
              >
                <h3 className="text-lg font-semibold">Departure Time Analysis</h3>
                <div className="mt-4 space-y-3">
                  {results.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex items-center justify-between rounded-xl p-4 ${
                        result.status === "optimal"
                          ? "border-2 border-primary bg-primary/10"
                          : result.status === "peak"
                          ? "border border-accent/30 bg-accent/5"
                          : "border border-border/50 bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {result.status === "optimal" && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <div className="font-medium">Leave at {result.time}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.status === "optimal"
                              ? "Best time to leave"
                              : result.status === "peak"
                              ? "Peak traffic"
                              : "Moderate traffic"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            result.status === "optimal" ? "text-primary" : ""
                          }`}
                        >
                          {result.duration}
                        </div>
                        {result.status === "optimal" && (
                          <div className="text-sm font-medium text-primary">
                            Save 18 min
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
