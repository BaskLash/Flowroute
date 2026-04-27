"use client"

import { useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Loader2, MapPin } from "lucide-react"
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

type TimelineEntry = {
  time: string
  timestamp: number
  duration: number
}

type AnalyzeResponse = {
  current_duration: number
  best_duration: number
  best_departure_time: string
  time_saved: number
  timeline: TimelineEntry[]
  window_start: string
  window_end: string
  demo_mode: boolean
}

type DisplayResult = {
  time: string
  durationMin: number
  status: DemoResultStatus
  saved_minutes?: number
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

function classifyTimeline(data: AnalyzeResponse): DisplayResult[] {
  if (data.timeline.length === 0) return []
  const best = data.best_duration
  const worst = Math.max(...data.timeline.map((e) => e.duration))
  const range = Math.max(1, worst - best)

  return data.timeline.map((entry) => {
    if (entry.duration === best) {
      return {
        time: entry.time,
        durationMin: entry.duration,
        status: "optimal",
        saved_minutes: data.time_saved,
      }
    }
    const ratio = (entry.duration - best) / range
    const status: DemoResultStatus = ratio >= 0.6 ? "peak" : "moderate"
    return { time: entry.time, durationMin: entry.duration, status }
  })
}

export function DemoSection() {
  const ref = useSectionView<HTMLElement>("demo")
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const resultsReported = useRef(false)

  const originRef = useRef<HTMLInputElement>(null)
  const destinationRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)

  const firstFocusAt = useRef<number | null>(null)
  const submitAttempts = useRef(0)

  const displayResults = useMemo(
    () => (result ? classifyTimeline(result) : []),
    [result],
  )

  const onFieldFocus = (field: DemoField) => {
    if (firstFocusAt.current == null) firstFocusAt.current = performance.now()
    trackDemoFieldFocus(field)
  }

  const onFieldBlur = (field: DemoField, el: HTMLInputElement | null) => {
    if (!el) return
    const value = el.value.trim()
    trackDemoFieldChange(field, value.length > 0, value.length)
  }

  const handleSubmit = async () => {
    submitAttempts.current += 1
    const attempt = submitAttempts.current

    const origin = originRef.current?.value.trim() ?? ""
    const destination = destinationRef.current?.value.trim() ?? ""
    const startTime = startTimeRef.current?.value.trim() ?? ""
    const endTime = endTimeRef.current?.value.trim() ?? ""

    const formFillMs =
      firstFocusAt.current != null
        ? Math.round(performance.now() - firstFocusAt.current)
        : 0

    trackCta("compare_departure_times", "demo", {
      cta_text: "Compare Departure Times",
    })

    trackDemoSubmit({
      origin_present: origin.length > 0,
      destination_present: destination.length > 0,
      time_window_present: startTime.length > 0 || endTime.length > 0,
      form_fill_ms: formFillMs,
      attempt_number: attempt,
    })
    if (attempt > 1) trackDemoRetry(attempt)

    if (!origin || !destination) {
      setError("Please enter both an origin and a destination.")
      return
    }

    setError(null)
    setLoading(true)
    setResult(null)
    resultsReported.current = false

    try {
      const resp = await fetch("/api/analyze-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
        }),
      })

      const data = (await resp.json().catch(() => ({}))) as
        | AnalyzeResponse
        | { detail?: string }

      if (!resp.ok) {
        const detail =
          (data as { detail?: string }).detail ?? `Server error (${resp.status})`
        throw new Error(detail)
      }

      const analyzed = data as AnalyzeResponse
      setResult(analyzed)

      if (!resultsReported.current) {
        resultsReported.current = true
        trackDemoResultsView({
          result_count: analyzed.timeline.length,
          has_optimal: analyzed.time_saved > 0,
        })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(message)
    } finally {
      setLoading(false)
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
                  placeholder="From: address, city, postal code"
                  className="h-12 bg-secondary/50 pl-10"
                  onFocus={() => onFieldFocus("origin")}
                  onBlur={(e) => onFieldBlur("origin", e.currentTarget)}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <Input
                  ref={destinationRef}
                  type="text"
                  placeholder="To: address, city, postal code"
                  className="h-12 bg-secondary/50 pl-10"
                  onFocus={() => onFieldFocus("destination")}
                  onBlur={(e) => onFieldBlur("destination", e.currentTarget)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={startTimeRef}
                    type="time"
                    aria-label="Earliest departure"
                    className="h-12 bg-secondary/50 pl-10"
                    onFocus={() => onFieldFocus("time_window")}
                    onBlur={(e) => onFieldBlur("time_window", e.currentTarget)}
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={endTimeRef}
                    type="time"
                    aria-label="Latest departure"
                    className="h-12 bg-secondary/50 pl-10"
                    onFocus={() => onFieldFocus("time_window")}
                    onBlur={(e) => onFieldBlur("time_window", e.currentTarget)}
                  />
                </div>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Time window is optional — leave blank to scan the next 2 hours.
              </p>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing traffic...
                  </>
                ) : (
                  <>
                    Compare Departure Times
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && displayResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.4 }}
                className="mt-8 border-t border-border/50 pt-8"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">Departure Time Analysis</h3>
                  <span className="text-xs text-muted-foreground">
                    {result.window_start} – {result.window_end}
                  </span>
                </div>

                {result.demo_mode && (
                  <p className="mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    Showing simulated data — set GOOGLE_MAPS_API_KEY to use live traffic.
                  </p>
                )}

                <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {displayResults.map((row, index) => (
                    <motion.button
                      key={`${row.time}-${index}`}
                      type="button"
                      onClick={() =>
                        trackDemoResultClick({
                          result_index: index,
                          status: row.status,
                          saved_minutes: row.saved_minutes,
                        })
                      }
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
                      className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        row.status === "optimal"
                          ? "border-2 border-primary bg-primary/10 hover:bg-primary/15"
                          : row.status === "peak"
                          ? "border border-accent/30 bg-accent/5 hover:bg-accent/10"
                          : "border border-border/50 bg-secondary/30 hover:bg-secondary/50"
                      }`}
                      aria-label={`Select departure at ${row.time}`}
                    >
                      <div className="flex items-center gap-3">
                        {row.status === "optimal" && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <div className="font-medium">Leave at {row.time}</div>
                          <div className="text-sm text-muted-foreground">
                            {row.status === "optimal"
                              ? "Best time to leave"
                              : row.status === "peak"
                              ? "Peak traffic"
                              : "Moderate traffic"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            row.status === "optimal" ? "text-primary" : ""
                          }`}
                        >
                          {formatDuration(row.durationMin)}
                        </div>
                        {row.status === "optimal" &&
                          row.saved_minutes !== undefined &&
                          row.saved_minutes > 0 && (
                            <div className="text-sm font-medium text-primary">
                              Save {row.saved_minutes} min
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
