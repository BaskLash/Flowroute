import { NextResponse } from "next/server"
import { z } from "zod"

import {
  buildSlots,
  DEFAULT_WINDOW_HOURS,
  ensureFutureWindow,
  formatHHMM,
  getAlternativeRoutes,
  parseTimeInput,
  resolveSlots,
  TrafficError,
  type AnalyzeResponse,
  type TimelineEntry,
} from "@/lib/traffic"
import { trafficCache } from "@/lib/traffic-cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const RequestSchema = z.object({
  origin: z.string().min(1, "origin is required").max(500),
  destination: z.string().min(1, "destination is required").max(500),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { detail: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    )
  }
  const { origin, destination, start_time, end_time } = parsed.data

  if (!origin.trim() || !destination.trim()) {
    return NextResponse.json(
      { detail: "origin and destination are required" },
      { status: 400 },
    )
  }

  const now = new Date()

  let rawWindowStart: Date
  let rawWindowEnd: Date
  try {
    rawWindowStart = start_time
      ? parseTimeInput(start_time, now)
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          0,
          0,
        )
    rawWindowEnd = end_time
      ? parseTimeInput(end_time, now)
      : new Date(rawWindowStart.getTime() + DEFAULT_WINDOW_HOURS * 60 * 60 * 1000)
  } catch (err) {
    const message = err instanceof TrafficError ? err.message : "Invalid time format"
    return NextResponse.json({ detail: message }, { status: 400 })
  }

  if (rawWindowEnd.getTime() <= rawWindowStart.getTime()) {
    rawWindowEnd = new Date(rawWindowEnd.getTime() + 24 * 60 * 60 * 1000)
  }

  // Project the window to the future when needed. Google's TRAFFIC_AWARE_OPTIMAL
  // model only returns predictive durations for future timestamps; without this
  // shift, any past slot would collapse to "now+60s" and every slot would
  // return the same number — exactly the bug we're fixing.
  const { start: windowStart, end: windowEnd, projected } = ensureFutureWindow(
    rawWindowStart,
    rawWindowEnd,
    now,
  )

  const slots = buildSlots(windowStart, windowEnd)
  if (slots.length === 0) {
    return NextResponse.json(
      { detail: "No departure slots in the given window" },
      { status: 400 },
    )
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? ""

  let resolved
  try {
    resolved = await resolveSlots({
      origin: origin.trim(),
      destination: destination.trim(),
      slots,
      apiKey,
      cache: trafficCache,
    })
  } catch {
    return NextResponse.json(
      { detail: "Could not retrieve traffic data. Try again in a moment." },
      { status: 502 },
    )
  }

  const timeline: TimelineEntry[] = []
  for (const slot of slots) {
    const seconds = resolved.durations.get(slot.getTime())
    if (seconds == null) continue
    timeline.push({
      time: formatHHMM(slot),
      timestamp: Math.floor(slot.getTime() / 1000),
      duration: Math.round(seconds / 60),
    })
  }

  if (timeline.length === 0) {
    return NextResponse.json(
      {
        detail:
          "Could not retrieve traffic data. Check your API key and locations.",
      },
      { status: 502 },
    )
  }

  const current = timeline[0]
  const best = timeline.reduce(
    (acc, e) => (e.duration < acc.duration ? e : acc),
    timeline[0],
  )
  const worst = timeline.reduce(
    (acc, e) => (e.duration > acc.duration ? e : acc),
    timeline[0],
  )
  const timeSaved = Math.max(0, worst.duration - best.duration)

  // Fetch alternative routes for the best slot. We do not block the response
  // on transient failures here — if Routes API is unavailable, the slot data
  // is still useful on its own.
  let routes: AnalyzeResponse["routes"] = []
  // Guarantee the timestamp we feed Routes API falls inside the (possibly
  // projected) window. timeline entries are derived from `slots` which are
  // built from windowStart..windowEnd, so this should always pass — the
  // assertion is here to catch regressions in slot construction.
  const windowStartSec = Math.floor(windowStart.getTime() / 1000)
  const windowEndSec = Math.floor(windowEnd.getTime() / 1000)
  const inWindow =
    best.timestamp >= windowStartSec && best.timestamp <= windowEndSec
  if (apiKey && inWindow) {
    try {
      routes = await getAlternativeRoutes(
        origin.trim(),
        destination.trim(),
        best.timestamp,
        apiKey,
      )
    } catch {
      routes = []
    }
  }

  const payload: AnalyzeResponse = {
    current_duration: current.duration,
    best_duration: best.duration,
    best_departure_time: best.time,
    worst_duration: worst.duration,
    worst_departure_time: worst.time,
    time_saved: timeSaved,
    timeline,
    window_start: formatHHMM(windowStart),
    window_end: formatHHMM(windowEnd),
    projected_to_next_week: projected,
    demo_mode: resolved.demoMode,
    routes,
  }

  return NextResponse.json(payload)
}
