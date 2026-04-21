"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { MapPin, Clock, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSectionView } from "@/hooks/use-section-view"
import {
  trackCta,
  trackDemoFieldChange,
  trackDemoFieldFocus,
  trackDemoResultClick,
  trackDemoResultsView,
  trackDemoRetry,
  trackDemoSubmit,
  type DemoField,
  type DemoResultStatus,
} from "@/lib/analytics"

type DemoResult = {
  time: string
  duration: string
  status: DemoResultStatus
  saved_minutes?: number
}

const RESULTS: DemoResult[] = [
  { time: "17:00", duration: "55 min", status: "peak" },
  { time: "17:18", duration: "42 min", status: "moderate" },
  { time: "17:42", duration: "37 min", status: "optimal", saved_minutes: 18 },
  { time: "18:00", duration: "40 min", status: "moderate" },
]

export function DemoSection() {
  const ref = useSectionView<HTMLElement>("demo")
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [showResults, setShowResults] = useState(false)
  const resultsReported = useRef(false)

  const originRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)

  const firstFocusAt = useRef<number | null>(null)
  const submitAttempts = useRef(0)

  const onFieldFocus = (field: DemoField) => {
    if (firstFocusAt.current == null) firstFocusAt.current = performance.now()
    trackDemoFieldFocus(field)
  }

  const onFieldBlur = (
    field: DemoField,
    el: HTMLInputElement | null
  ) => {
    if (!el) return
    const value = el.value.trim()
    trackDemoFieldChange(field, value.length > 0, value.length)
  }

  const handleSubmit = () => {
    submitAttempts.current += 1
    const attempt = submitAttempts.current

    const originVal = originRef.current?.value.trim() ?? ""
    const destVal = destinationRef.current?.value.trim() ?? ""
    const timeVal = timeRef.current?.value.trim() ?? ""

    const form_fill_ms =
      firstFocusAt.current != null
        ? Math.round(performance.now() - firstFocusAt.current)
        : 0

    trackCta("compare_departure_times", "demo", {
      cta_text: "Compare Departure Times",
    })

    trackDemoSubmit({
      origin_present: originVal.length > 0,
      destination_present: destVal.length > 0,
      time_window_present: timeVal.length > 0,
      form_fill_ms,
      attempt_number: attempt,
    })

    if (attempt > 1) trackDemoRetry(attempt)

    setShowResults(true)

    if (!resultsReported.current) {
      resultsReported.current = true
      trackDemoResultsView({
        result_count: RESULTS.length,
        has_optimal: RESULTS.some((r) => r.status === "optimal"),
      })
    }
  }

  return (
    <section
      ref={ref}
      className="relative px-4 py-24 sm:px-6 lg:px-8"
      id="demo"
    >
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
                  ref={originRef}
                  type="text"
                  placeholder="From: Home, Office, Address..."
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="123 Main Street"
                  onFocus={() => onFieldFocus("origin")}
                  onBlur={(e) => onFieldBlur("origin", e.currentTarget)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  ref={destinationRef}
                  type="text"
                  placeholder="To: Work, Destination..."
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="456 Business Park"
                  onFocus={() => onFieldFocus("destination")}
                  onBlur={(e) => onFieldBlur("destination", e.currentTarget)}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={timeRef}
                  type="text"
                  placeholder="Time window (optional): 5pm - 7pm"
                  className="h-12 bg-secondary/50 pl-10"
                  defaultValue="5:00 PM - 6:30 PM"
                  onFocus={() => onFieldFocus("time_window")}
                  onBlur={(e) => onFieldBlur("time_window", e.currentTarget)}
                />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                onClick={handleSubmit}
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
                  {RESULTS.map((result, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      onClick={() =>
                        trackDemoResultClick({
                          result_index: index,
                          status: result.status,
                          saved_minutes: result.saved_minutes,
                        })
                      }
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        result.status === "optimal"
                          ? "border-2 border-primary bg-primary/10 hover:bg-primary/15"
                          : result.status === "peak"
                          ? "border border-accent/30 bg-accent/5 hover:bg-accent/10"
                          : "border border-border/50 bg-secondary/30 hover:bg-secondary/50"
                      }`}
                      aria-label={`Select departure at ${result.time}`}
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
                        {result.status === "optimal" && result.saved_minutes && (
                          <div className="text-sm font-medium text-primary">
                            Save {result.saved_minutes} min
                          </div>
                        )}
                      </div>
                    </motion.button>
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
