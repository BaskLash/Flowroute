export const SIMULATION_INTERVAL_MIN = 10
export const DEFAULT_WINDOW_HOURS = 2

const COMPUTE_ROUTE_MATRIX_URL =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"

export type AnalyzeRequest = {
  origin: string
  destination: string
  start_time?: string | null
  end_time?: string | null
}

export type TimelineEntry = {
  time: string
  timestamp: number
  duration: number
}

export type AnalyzeResponse = {
  current_duration: number
  best_duration: number
  best_departure_time: string
  time_saved: number
  timeline: TimelineEntry[]
  window_start: string
  window_end: string
  demo_mode: boolean
}

export class TrafficError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function parseTimeInput(value: string, reference: Date): Date {
  const trimmed = value.trim()
  if (trimmed.includes("T") || trimmed.length > 5) {
    const iso = new Date(trimmed)
    if (!Number.isNaN(iso.getTime())) return iso
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) throw new TrafficError(`Invalid time format: ${value}`)
  const [, h, m] = match
  const out = new Date(reference)
  out.setHours(Number(h), Number(m), 0, 0)
  return out
}

export function floorToBucket(date: Date, bucketMinutes = 10): number {
  const total = date.getHours() * 60 + date.getMinutes()
  return Math.floor(total / bucketMinutes) * bucketMinutes
}

export function buildSlots(windowStart: Date, windowEnd: Date): Date[] {
  const slots: Date[] = []
  const cursor = new Date(windowStart)
  while (cursor.getTime() <= windowEnd.getTime()) {
    slots.push(new Date(cursor))
    cursor.setMinutes(cursor.getMinutes() + SIMULATION_INTERVAL_MIN)
  }
  return slots
}

export function formatHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

function demoDuration(departure: Date): number {
  const base = 40 * 60
  const noise = (Math.floor(Math.random() * 21) - 10) * 60
  const hour = departure.getHours()
  const peakBoost =
    (hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)
      ? (10 + Math.floor(Math.random() * 11)) * 60
      : 0
  return Math.max(10 * 60, base + noise + peakBoost)
}

async function fetchSingleSlot(
  origin: string,
  destination: string,
  departureTs: number,
  apiKey: string,
  signal: AbortSignal,
): Promise<[number, number | null]> {
  const nowSec = Math.floor(Date.now() / 1000)
  const safeTs = departureTs <= nowSec ? nowSec + 60 : departureTs
  const departureRfc3339 = new Date(safeTs * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")

  const payload = {
    origins: [{ waypoint: { address: origin } }],
    destinations: [{ waypoint: { address: destination } }],
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    departureTime: departureRfc3339,
  }

  const resp = await fetch(COMPUTE_ROUTE_MATRIX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "originIndex,destinationIndex,duration,distanceMeters,status",
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!resp.ok) {
    return [departureTs, null]
  }

  const elements = (await resp.json().catch(() => null)) as
    | Array<{
        status?: { code?: number }
        duration?: string
      }>
    | null

  if (!elements || !Array.isArray(elements) || elements.length === 0) {
    return [departureTs, null]
  }

  const elem = elements[0]
  if (elem.status && elem.status.code && elem.status.code !== 0) {
    return [departureTs, null]
  }

  const durationStr = elem.duration ?? ""
  if (!durationStr) return [departureTs, null]

  const seconds = Number.parseInt(durationStr.replace(/s$/, ""), 10)
  if (Number.isNaN(seconds)) return [departureTs, null]
  return [departureTs, seconds]
}

export async function getDurationsMatrix(
  origin: string,
  destination: string,
  departureTimestamps: number[],
  apiKey: string,
): Promise<Map<number, number | null>> {
  if (departureTimestamps.length === 0) return new Map()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)
  try {
    const pairs = await Promise.all(
      departureTimestamps.map((ts) =>
        fetchSingleSlot(origin, destination, ts, apiKey, controller.signal),
      ),
    )
    return new Map(pairs)
  } finally {
    clearTimeout(timeout)
  }
}

export async function resolveSlots(params: {
  origin: string
  destination: string
  slots: Date[]
  apiKey: string
  cache: {
    get: (
      origin: string,
      destination: string,
      dayOfWeek: number,
      timeBucket: number,
    ) => number | null
    set: (
      origin: string,
      destination: string,
      dayOfWeek: number,
      timeBucket: number,
      value: number,
    ) => void
  }
}): Promise<{
  durations: Map<number, number | null>
  demoMode: boolean
}> {
  const { origin, destination, slots, apiKey, cache } = params
  const hits = new Map<number, number>()
  const misses: Date[] = []

  for (const slot of slots) {
    const cached = cache.get(
      origin,
      destination,
      slot.getDay(),
      floorToBucket(slot),
    )
    if (cached !== null) {
      hits.set(slot.getTime(), cached)
    } else {
      misses.push(slot)
    }
  }

  let demoMode = false
  let fresh: Map<number, number | null> = new Map()

  if (misses.length > 0) {
    const tsList = misses.map((s) => Math.floor(s.getTime() / 1000))
    if (!apiKey) {
      demoMode = true
      fresh = new Map(tsList.map((ts) => [ts, demoDuration(new Date(ts * 1000))]))
    } else {
      fresh = await getDurationsMatrix(origin, destination, tsList, apiKey)
    }
  }

  const out = new Map<number, number | null>()
  for (const slot of slots) {
    const ms = slot.getTime()
    if (hits.has(ms)) {
      out.set(ms, hits.get(ms)!)
      continue
    }
    const ts = Math.floor(ms / 1000)
    const value = fresh.get(ts) ?? null
    if (value !== null) {
      cache.set(origin, destination, slot.getDay(), floorToBucket(slot), value)
    }
    out.set(ms, value)
  }

  return { durations: out, demoMode }
}
