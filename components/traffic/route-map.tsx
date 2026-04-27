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

function FitToRoute({ coords }: { coords: Array<[number, number]> }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length < 2) return
    const bounds = L.latLngBounds(coords.map(([lat, lng]) => L.latLng(lat, lng)))
    map.fitBounds(bounds, { padding: [16, 16] })
  }, [coords, map])
  return null
}

export type RouteMapProps = {
  route: RouteAlternative
  /** Hex color for the polyline. Use distinct colors per rank. */
  color: string
  className?: string
  /** Map height utility class. Default: h-56. */
  heightClassName?: string
}

export default function RouteMap({
  route,
  color,
  className,
  heightClassName = "h-56",
}: RouteMapProps) {
  const coords = useMemo(
    () => decodePolyline(route.encoded_polyline),
    [route.encoded_polyline],
  )
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 100)
    return () => window.clearTimeout(t)
  }, [])

  if (coords.length < 2) return null

  const start = coords[0]
  const end = coords[coords.length - 1]
  const center: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]

  return (
    <div className={cn("relative", className)}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        ref={(instance) => {
          mapRef.current = instance
        }}
        className={cn(
          "w-full overflow-hidden rounded-xl border border-border/60",
          heightClassName,
        )}
        aria-label={`Map for route: ${route.description || `Route ${route.index + 1}`}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={coords}
          pathOptions={{ color, weight: 6, opacity: 0.95 }}
        />
        <Marker position={start} />
        <Marker position={end} />
        <FitToRoute coords={coords} />
      </MapContainer>
    </div>
  )
}
