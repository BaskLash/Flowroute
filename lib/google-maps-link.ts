import { decodePolyline } from "@/lib/decode-polyline"

const DIR_BASE = "https://www.google.com/maps/dir/?api=1"

function pickWaypoints(coords: Array<[number, number]>): Array<[number, number]> {
  // Two interior anchors at ~1/3 and ~2/3 of the path are usually enough to
  // nudge Google's routing toward this specific alternative without
  // over-constraining and producing a weird detour.
  if (coords.length < 6) return []
  const a = coords[Math.floor(coords.length / 3)]
  const b = coords[Math.floor((coords.length * 2) / 3)]
  return [a, b]
}

function fmtLatLng([lat, lng]: [number, number]): string {
  // 5 decimal places ≈ 1.1m precision, plenty for routing.
  return `${lat.toFixed(5)},${lng.toFixed(5)}`
}

export type BuildGoogleMapsUrlInput = {
  origin: string
  destination: string
  /** Encoded polyline of the chosen route. Used to derive waypoints so the
   *  Google Maps app picks *this* alternative rather than its own default. */
  encodedPolyline?: string
  /** Skip waypoint-nudging for the fastest route — Google's default is
   *  already that one, and extra waypoints can paradoxically push it
   *  onto a worse path. */
  isPrimary: boolean
}

export function buildGoogleMapsUrl(input: BuildGoogleMapsUrlInput): string {
  const params = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    travelmode: "driving",
  })

  if (!input.isPrimary && input.encodedPolyline) {
    const coords = decodePolyline(input.encodedPolyline)
    const waypoints = pickWaypoints(coords)
    if (waypoints.length > 0) {
      // Google Maps URL spec: waypoints separated by `|` (URL-encoded as %7C).
      params.set("waypoints", waypoints.map(fmtLatLng).join("|"))
    }
  }

  return `${DIR_BASE}&${params.toString()}`
}
