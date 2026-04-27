const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS ?? "1200")

type Entry = { value: number; expiresAt: number }

const store = new Map<string, Entry>()

function makeKey(
  origin: string,
  destination: string,
  dayOfWeek: number,
  timeBucket: number,
): string {
  return `${origin.toLowerCase().trim()}|${destination.toLowerCase().trim()}|${dayOfWeek}|${timeBucket}`
}

export function get(
  origin: string,
  destination: string,
  dayOfWeek: number,
  timeBucket: number,
): number | null {
  const key = makeKey(origin, destination, dayOfWeek, timeBucket)
  const entry = store.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.value
}

export function set(
  origin: string,
  destination: string,
  dayOfWeek: number,
  timeBucket: number,
  value: number,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): void {
  const key = makeKey(origin, destination, dayOfWeek, timeBucket)
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export const trafficCache = { get, set }
