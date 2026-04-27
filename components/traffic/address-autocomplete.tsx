"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const PHOTON_URL = "https://photon.komoot.io/api/"
const DEBOUNCE_MS = 250
const MIN_QUERY_LEN = 3
const MAX_RESULTS = 6

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    street?: string
    housenumber?: string
    postcode?: string
    city?: string
    state?: string
    country?: string
    type?: string
    osm_id?: number
  }
}

type Suggestion = {
  id: string
  label: string
  secondary: string
}

function formatSuggestion(feat: PhotonFeature): Suggestion | null {
  const p = feat.properties
  if (!p) return null

  const streetLine = [
    [p.street, p.housenumber].filter(Boolean).join(" ").trim() || p.name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  const cityLine = [p.postcode, p.city ?? p.state, p.country]
    .filter(Boolean)
    .join(", ")

  const label =
    streetLine && cityLine
      ? `${streetLine}, ${cityLine}`
      : streetLine || cityLine || p.name || ""

  if (!label) return null

  const id =
    [p.osm_id, feat.geometry?.coordinates?.join(",")]
      .filter(Boolean)
      .join(":") || label

  return {
    id,
    label,
    secondary: cityLine || p.country || "",
  }
}

export type AddressAutocompleteProps = {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  ariaLabel?: string
  leftSlot?: React.ReactNode
  /** Optional: bias suggestions toward a location (lon, lat). */
  bias?: { lon: number; lat: number }
  /** Locale hint for Photon (e.g. "de", "en"). */
  lang?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function AddressAutocomplete({
  value,
  onValueChange,
  placeholder,
  className,
  inputClassName,
  ariaLabel,
  leftSlot,
  bias,
  lang,
  onFocus,
  onBlur,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState(-1)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<number | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)
  // When the user picks a suggestion we also call onValueChange, which would
  // re-trigger the effect below and immediately open the dropdown again with
  // the same query. This flag suppresses that round-trip.
  const skipNextLookup = React.useRef(false)

  React.useEffect(() => {
    if (skipNextLookup.current) {
      skipNextLookup.current = false
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    const query = value.trim()
    if (query.length < MIN_QUERY_LEN) {
      setSuggestions([])
      setLoading(false)
      setOpen(false)
      abortRef.current?.abort()
      return
    }

    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)

      const params = new URLSearchParams({
        q: query,
        limit: String(MAX_RESULTS),
      })
      if (bias) {
        params.set("lon", String(bias.lon))
        params.set("lat", String(bias.lat))
      }
      if (lang) params.set("lang", lang)

      fetch(`${PHOTON_URL}?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data: { features?: PhotonFeature[] }) => {
          const list = (data.features ?? [])
            .map(formatSuggestion)
            .filter((s): s is Suggestion => s !== null)
          setSuggestions(list)
          setOpen(list.length > 0)
          setActiveIndex(-1)
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return
          setSuggestions([])
          setOpen(false)
        })
        .finally(() => setLoading(false))
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [value, bias, lang])

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const pick = (s: Suggestion) => {
    skipNextLookup.current = true
    onValueChange(s.label)
    setOpen(false)
    setActiveIndex(-1)
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setOpen(true)
        setActiveIndex(0)
        e.preventDefault()
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      pick(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {leftSlot}
      <Input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className={inputClassName}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
          onFocus?.()
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="address-suggestions"
      />
      {loading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-xl border border-border/60 bg-popover/95 p-1 shadow-lg backdrop-blur"
        >
          {suggestions.map((s, idx) => (
            <li
              key={s.id}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => setActiveIndex(idx)}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-sm",
                idx === activeIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground hover:bg-secondary/60",
              )}
            >
              <div className="font-medium leading-tight">{s.label}</div>
              {s.secondary && s.secondary !== s.label && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {s.secondary}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
