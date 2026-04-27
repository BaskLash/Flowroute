"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

import { decodePolyline } from "@/lib/decode-polyline"
import type { RouteAlternative } from "@/lib/traffic"
import { cn } from "@/lib/utils"

// Leaflet's default marker icons reference paths that don't resolve through
// webpack/turbopack. Pin them to a CDN so they always load.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const ROUTE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"]

type DecodedRoute = RouteAlternative & {
  coords: Array<[number, number]>
}

function FitBounds({ routes }: { routes: DecodedRoute[] }) {
  const map = useMap()
  useEffect(() => {
    const allCoords = routes.flatMap((r) => r.coords)
    if (allCoords.length === 0) return
    const bounds = L.latLngBounds(allCoords.map(([lat, lng]) => L.latLng(lat, lng)))
    map.fitBounds(bounds, { padding: [24, 24] })
  }, [routes, map])
  return null
}

export type RouteMapProps = {
  routes: RouteAlternative[]
  /** Index of the route to visually emphasize (typically the fastest). */
  highlightIndex?: number
  className?: string
}

export default function RouteMap({
  routes,
  highlightIndex,
  className,
}: RouteMapProps) {
  const decoded = useMemo<DecodedRoute[]>(
    () =>
      routes
        .map((r) => ({ ...r, coords: decodePolyline(r.encoded_polyline) }))
        .filter((r) => r.coords.length >= 2),
    [routes],
  )

  // Leaflet doesn't auto-recompute size when its container becomes visible
  // (e.g. when the parent expands after a fetch). Nudge it on mount.
  const mapRef = useRef<L.Map | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 100)
    return () => window.clearTimeout(t)
  }, [])

  if (decoded.length === 0) return null

  const fastestIdx = highlightIndex ?? decoded.findIndex((r) => r.is_fastest)
  const start = decoded[0].coords[0]
  const end = decoded[0].coords[decoded[0].coords.length - 1]
  const initialCenter: [number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ]

  return (
    <div className={cn("relative", className)}>
      <MapContainer
        center={initialCenter}
        zoom={11}
        scrollWheelZoom={false}
        ref={(instance) => {
          mapRef.current = instance
        }}
        className="h-72 w-full overflow-hidden rounded-xl border border-border/60"
        aria-label="Map showing alternative driving routes"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Render non-highlighted routes first so the fastest sits on top. */}
        {decoded.map((route, i) =>
          i === fastestIdx ? null : (
            <Polyline
              key={`alt-${route.index}`}
              positions={route.coords}
              pathOptions={{
                color: ROUTE_COLORS[i % ROUTE_COLORS.length],
                weight: 4,
                opacity: 0.5,
                dashArray: "6 6",
              }}
            />
          ),
        )}
        {fastestIdx >= 0 && (
          <Polyline
            key={`primary-${decoded[fastestIdx].index}`}
            positions={decoded[fastestIdx].coords}
            pathOptions={{
              color: ROUTE_COLORS[fastestIdx % ROUTE_COLORS.length],
              weight: 6,
              opacity: 0.95,
            }}
          />
        )}
        <Marker position={start} />
        <Marker position={end} />
        <FitBounds routes={decoded} />
      </MapContainer>
    </div>
  )
}
