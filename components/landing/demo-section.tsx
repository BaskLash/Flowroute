"use client"

import { useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddressAutocomplete } from "@/components/traffic/address-autocomplete"
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

type RouteAlternative = {
  index: number
  duration: number
  distance_meters: number
  description: string
  encoded_polyline: string
  labels: string[]
  is_fastest: boolean
  saves_minutes_vs_slowest: number
}

type AnalyzeResponse = {
  current_duration: number
  best_duration: number
  best_departure_time: string
  worst_duration: number
  worst_departure_time: string
  time_saved: number
  timeline: TimelineEntry[]
  window_start: string
  window_end: string
  projected_to_next_week: boolean
  demo_mode: boolean
  routes: RouteAlternative[]
}

const RouteMap = dynamic(() => import("@/components/traffic/route-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 w-full items-center justify-center rounded-xl border border-border/60 bg-secondary/30 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading map…
    </div>
  ),
})

function formatKm(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${meters} m`
}

function classifyRoadType(description: string, labels: string[]): string {
  const d = description.toLowerCase()
  if (labels.includes("FUEL_EFFICIENT")) return "Fuel-efficient"
  if (/\b(a\d+|autobahn|motorway|highway|interstate|i-\d+)\b/.test(d)) return "Highway"
  if (/\b(b\d+|country|landstr|backroad|scenic)\b/.test(d)) return "Country road"
  return "Alternate route"
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
  const worst = data.worst_duration
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
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const resultsReported = useRef(false)

  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)

  const firstFocusAt = useRef<number | null>(null)
  const submitAttempts = useRef(0)
  const fieldHasValueAtBlur = useRef<Record<DemoField, number>>({
    origin: 0,
    destination: 0,
    time_window: 0,
  })

  const displayResults = useMemo(
    () => (result ? classifyTimeline(result) : []),
    [result],
  )

  const onFieldFocus = (field: DemoField) => {
    if (firstFocusAt.current == null) firstFocusAt.current = performance.now()
    trackDemoFieldFocus(field)
  }

  const onFieldBlurValue = (field: DemoField, value: string) => {
    const trimmed = value.trim()
    fieldHasValueAtBlur.current[field] = trimmed.length
    trackDemoFieldChange(field, trimmed.length > 0, trimmed.length)
  }

  const handleSubmit = async () => {
    submitAttempts.current += 1
    const attempt = submitAttempts.current

    const o = origin.trim()
    const d = destination.trim()
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
      origin_present: o.length > 0,
      destination_present: d.length > 0,
      time_window_present: startTime.length > 0 || endTime.length > 0,
      form_fill_ms: formFillMs,
      attempt_number: attempt,
    })
    if (attempt > 1) trackDemoRetry(attempt)

    if (!o || !d) {
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
          origin: o,
          destination: d,
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
              <AddressAutocomplete
                value={origin}
                onValueChange={setOrigin}
                placeholder="From: address, city, postal code"
                ariaLabel="Origin"
                inputClassName="h-12 bg-secondary/50 pl-10"
                lang="en"
                leftSlot={
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                }
                onFocus={() => onFieldFocus("origin")}
                onBlur={() => onFieldBlurValue("origin", origin)}
              />
              <AddressAutocomplete
                value={destination}
                onValueChange={setDestination}
                placeholder="To: address, city, postal code"
                ariaLabel="Destination"
                inputClassName="h-12 bg-secondary/50 pl-10"
                lang="en"
                leftSlot={
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-primary" />
                }
                onFocus={() => onFieldFocus("destination")}
                onBlur={() => onFieldBlurValue("destination", destination)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={startTimeRef}
                    type="time"
                    aria-label="Earliest departure"
                    className="h-12 bg-secondary/50 pl-10"
                    onFocus={() => onFieldFocus("time_window")}
                    onBlur={(e) =>
                      onFieldBlurValue("time_window", e.currentTarget.value)
                    }
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
                    onBlur={(e) =>
                      onFieldBlurValue("time_window", e.currentTarget.value)
                    }
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

                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-border/50 bg-secondary/30 p-3 sm:grid-cols-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Best</div>
                    <div className="font-semibold">
                      {formatDuration(result.best_duration)} @ {result.best_departure_time}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Worst</div>
                    <div className="font-semibold">
                      {formatDuration(result.worst_duration)} @ {result.worst_departure_time}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-xs text-muted-foreground">Save vs worst</div>
                    <div className="font-semibold text-primary">
                      {result.time_saved > 0
                        ? `${result.time_saved} min`
                        : "no spread"}
                    </div>
                  </div>
                </div>

                {result.projected_to_next_week && (
                  <p className="mt-3 flex items-start gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                    <CalendarClock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    Your time window has already passed today, so we're showing the
                    historical traffic pattern for the same weekday next week.
                  </p>
                )}

                {result.demo_mode && (
                  <p className="mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                    Showing simulated data — set GOOGLE_MAPS_API_KEY to use live traffic.
                  </p>
                )}

                {result.routes.length > 0 && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Navigation className="h-4 w-4 text-primary" />
                      Route options at {result.best_departure_time}
                    </div>
                    <RouteMap routes={result.routes} />
                    <div className="mt-3 space-y-2">
                      {result.routes.map((route) => {
                        const roadType = classifyRoadType(route.description, route.labels)
                        return (
                          <div
                            key={route.index}
                            className={`rounded-xl p-4 transition-colors ${
                              route.is_fastest
                                ? "border-2 border-primary bg-primary/10"
                                : "border border-border/50 bg-secondary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {route.is_fastest && (
                                    <Trophy className="h-4 w-4 flex-shrink-0 text-primary" />
                                  )}
                                  <span className="truncate font-medium">
                                    {route.description || `Route ${route.index + 1}`}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                  <span>{roadType}</span>
                                  <span>{formatKm(route.distance_meters)}</span>
                                  {route.is_fastest && (
                                    <span className="font-semibold text-primary">
                                      Fastest option
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-xl font-bold ${
                                    route.is_fastest ? "text-primary" : ""
                                  }`}
                                >
                                  {formatDuration(route.duration)}
                                </div>
                                {route.is_fastest && route.saves_minutes_vs_slowest > 0 && (
                                  <div className="text-xs font-medium text-primary">
                                    Save {route.saves_minutes_vs_slowest} min vs slowest
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-6 mb-2 text-sm font-semibold text-muted-foreground">
                  Time slot comparison
                </div>
                <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
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
                              Save {row.saved_minutes} min vs peak
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
