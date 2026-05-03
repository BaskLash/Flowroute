"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Medal,
  Navigation,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddressAutocomplete } from "@/components/traffic/address-autocomplete"
import { cn } from "@/lib/utils"
import { buildGoogleMapsUrl } from "@/lib/google-maps-link"
import {
  trackAnalyzeComplete,
  trackAnalyzeError,
  trackCta,
  trackDemoFieldChange,
  trackDemoFieldFocus,
  trackDemoResultClick,
  trackDemoResultsView,
  trackDemoRetry,
  trackDemoSubmit,
  trackRouteCardImpression,
  trackRouteOpenInMaps,
  type DemoField,
  type DemoResultStatus,
  type RoadType,
} from "@/lib/analytics"

type TimelineEntry = {
  time: string
  timestamp: number
  duration: number
}

type RouteAlternative = {
  index: number
  rank: 1 | 2 | 3
  duration: number
  distance_meters: number
  description: string
  encoded_polyline: string
  labels: string[]
  is_fastest: boolean
  saves_minutes_vs_slowest: number
}

const RANK_STYLE: Record<
  1 | 2 | 3,
  { color: string; label: string; cardClass: string; pillClass: string; durationClass: string }
> = {
  1: {
    color: "#10b981",
    label: "1st · Fastest",
    cardClass: "border-2 border-emerald-500/70 bg-emerald-500/10",
    pillClass: "bg-emerald-500 text-white",
    durationClass: "text-emerald-600 dark:text-emerald-400",
  },
  2: {
    color: "#f59e0b",
    label: "2nd · Runner-up",
    cardClass: "border border-amber-500/50 bg-amber-500/5",
    pillClass: "bg-amber-500 text-white",
    durationClass: "text-amber-600 dark:text-amber-400",
  },
  3: {
    color: "#64748b",
    label: "3rd · Alternative",
    cardClass: "border border-slate-400/50 bg-slate-500/5",
    pillClass: "bg-slate-500 text-white",
    durationClass: "text-slate-600 dark:text-slate-300",
  },
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

function classifyRoadType(description: string, labels: string[]): RoadType {
  const d = description.toLowerCase()
  if (labels.includes("FUEL_EFFICIENT")) return "Fuel-efficient"
  if (/\b(a\d+|autobahn|motorway|highway|interstate|i-\d+)\b/.test(d)) return "Highway"
  if (/\b(b\d+|country|landstr|backroad|scenic)\b/.test(d)) return "Country road"
  return "Alternate route"
}

function deviceSurface(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop"
  if (window.innerWidth < 640) return "mobile"
  if (window.innerWidth < 1024) return "tablet"
  return "desktop"
}

function parseHHMM(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function windowMinutes(start: string, end: string, slotCount: number): number {
  const a = parseHHMM(start)
  const b = parseHHMM(end)
  if (a == null || b == null) return Math.max(0, (slotCount - 1) * 10)
  const raw = b - a
  return raw <= 0 ? raw + 24 * 60 : raw
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

export type RoutePlannerProps = {
  /** Wraps the planner in the standard card chrome. Set false to render bare. */
  showCard?: boolean
  className?: string
}

export function RoutePlanner({ showCard = true, className }: RoutePlannerProps) {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const resultsReported = useRef(false)

  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const firstFocusAt = useRef<number | null>(null)
  const submitAttempts = useRef(0)
  const submitStartedAt = useRef<number>(0)
  const lastReportedRoutesKey = useRef<string>("")

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
    trackDemoFieldChange(field, trimmed.length > 0, trimmed.length)
  }

  // Fire one route_card_impression per route in a result set, deduped by a
  // key combining the encoded polylines so re-renders don't spam events.
  useEffect(() => {
    if (!result || result.routes.length === 0) return
    const key = result.routes.map((r) => r.encoded_polyline.slice(0, 16)).join("|")
    if (key === lastReportedRoutesKey.current) return
    lastReportedRoutesKey.current = key
    for (const route of result.routes) {
      trackRouteCardImpression({
        rank: route.rank,
        road_type: classifyRoadType(route.description, route.labels),
        duration_min: route.duration,
        is_fastest: route.is_fastest,
      })
    }
  }, [result])

  // Auto-scroll the results into view once they appear. Useful in the hero,
  // where the form sits at the top of the viewport and results may otherwise
  // expand below the fold.
  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [result])

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
    submitStartedAt.current = performance.now()

    let httpStatus = 0
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
      httpStatus = resp.status

      const data = (await resp.json().catch(() => ({}))) as
        | AnalyzeResponse
        | { detail?: string }

      if (!resp.ok) {
        const detail =
          (data as { detail?: string }).detail ?? `Server error (${resp.status})`
        throw new Error(detail)
      }

      const analyzed = data as AnalyzeResponse
      const latency = Math.round(performance.now() - submitStartedAt.current)
      setResult(analyzed)

      if (!resultsReported.current) {
        resultsReported.current = true
        trackDemoResultsView({
          result_count: analyzed.timeline.length,
          has_optimal: analyzed.time_saved > 0,
        })
        trackAnalyzeComplete({
          window_minutes: windowMinutes(
            analyzed.window_start,
            analyzed.window_end,
            analyzed.timeline.length,
          ),
          slot_count: analyzed.timeline.length,
          best_duration_min: analyzed.best_duration,
          worst_duration_min: analyzed.worst_duration,
          time_saved_min: analyzed.time_saved,
          route_count: analyzed.routes.length,
          has_routes: analyzed.routes.length > 0,
          projected_to_next_week: analyzed.projected_to_next_week,
          demo_mode: analyzed.demo_mode,
          latency_ms: latency,
        })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(message)
      trackAnalyzeError({
        status: httpStatus,
        detail: message.slice(0, 200),
        origin_present: o.length > 0,
        destination_present: d.length > 0,
        latency_ms: Math.round(performance.now() - submitStartedAt.current),
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmitForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void handleSubmit()
  }

  const containerClass = cn(
    showCard
      ? "rounded-2xl border border-border/50 bg-card/80 p-5 shadow-lg backdrop-blur-sm sm:p-6"
      : undefined,
    className,
  )

  return (
    <div className={containerClass}>
      <form className="space-y-3" onSubmit={onSubmitForm} noValidate>
        <AddressAutocomplete
          value={origin}
          onValueChange={setOrigin}
          field="origin"
          placeholder="From: address, city, postal code"
          ariaLabel="Origin"
          inputClassName="h-12 bg-secondary/50 pl-10"
          lang="en"
          enableCurrentLocation
          leftSlot={
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          }
          onFocus={() => onFieldFocus("origin")}
          onBlur={() => onFieldBlurValue("origin", origin)}
        />
        <AddressAutocomplete
          value={destination}
          onValueChange={setDestination}
          field="destination"
          placeholder="To: address, city, postal code"
          ariaLabel="Destination"
          inputClassName="h-12 bg-secondary/50 pl-10"
          lang="en"
          enableCurrentLocation
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
              onFocus={() => onFieldFocus("start_time")}
              onBlur={(e) => onFieldBlurValue("start_time", e.currentTarget.value)}
            />
          </div>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={endTimeRef}
              type="time"
              aria-label="Latest departure"
              className="h-12 bg-secondary/50 pl-10"
              onFocus={() => onFieldFocus("end_time")}
              onBlur={(e) => onFieldBlurValue("end_time", e.currentTarget.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Time window is optional — leave blank to scan the next 2 hours.
        </p>
        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing traffic...
            </>
          ) : (
            <>
              Check Route
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && displayResults.length > 0 && (
        <motion.div
          ref={resultsRef}
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
                {result.time_saved > 0 ? `${result.time_saved} min` : "no spread"}
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
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                <Navigation className="h-4 w-4 flex-shrink-0 text-primary" />
                <span>Route options at {result.best_departure_time}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  within {result.window_start}–{result.window_end}
                </span>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Ranked by travel time at the best departure slot. The fastest
                route is highlighted in green.
              </p>
              <div className="space-y-3">
                {result.routes.map((route) => {
                  const style = RANK_STYLE[route.rank]
                  const roadType = classifyRoadType(route.description, route.labels)
                  const RankIcon = route.rank === 1 ? Trophy : Medal
                  const mapsUrl = buildGoogleMapsUrl({
                    origin,
                    destination,
                    encodedPolyline: route.encoded_polyline,
                    isPrimary: route.is_fastest,
                  })
                  const onOpenMaps = () =>
                    trackRouteOpenInMaps({
                      rank: route.rank,
                      road_type: roadType,
                      duration_min: route.duration,
                      is_fastest: route.is_fastest,
                      surface: deviceSurface(),
                    })
                  return (
                    <div
                      key={route.index}
                      className={`overflow-hidden rounded-xl ${style.cardClass}`}
                      aria-label={`${style.label}: ${
                        route.description || `Route ${route.index + 1}`
                      }, ${formatDuration(route.duration)}`}
                    >
                      <div className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${style.pillClass}`}
                          >
                            <RankIcon className="h-3.5 w-3.5" />
                            {style.label}
                          </span>
                          <div className="text-right">
                            <div
                              className={`text-xl font-bold leading-tight sm:text-2xl ${style.durationClass}`}
                            >
                              {formatDuration(route.duration)}
                            </div>
                            {route.rank === 1 && route.saves_minutes_vs_slowest > 0 && (
                              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Save {route.saves_minutes_vs_slowest} min vs 3rd
                              </div>
                            )}
                            {route.rank > 1 &&
                              route.duration > result.routes[0].duration && (
                                <div className="text-xs text-muted-foreground">
                                  +{route.duration - result.routes[0].duration} min vs 1st
                                </div>
                              )}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium break-words">
                            {route.description || `Route ${route.index + 1}`}
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{roadType}</span>
                            <span>{formatKm(route.distance_meters)}</span>
                          </div>
                        </div>
                      </div>
                      <RouteMap
                        route={route}
                        color={style.color}
                        heightClassName={
                          route.rank === 1 ? "h-56 sm:h-64" : "h-44 sm:h-48"
                        }
                        className="px-1"
                      />
                      <div className="p-3 pt-3">
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={onOpenMaps}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          aria-label={`Open ${
                            route.description || `route ${route.index + 1}`
                          } in Google Maps`}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in Google Maps
                        </a>
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
  )
}
