"use client"

import { useEffect, useRef } from "react"
import {
  trackSectionDwell,
  trackSectionView,
  type SectionId,
} from "@/lib/analytics"

/**
 * IntersectionObserver-based section visibility tracking.
 *
 * Fires:
 *   - section_view  once, the first time the element crosses the threshold
 *   - section_dwell every time the element leaves the viewport after
 *                   having been seen (dwell_ms = continuous visible time)
 *
 * Replaces scroll-listener based visibility detection for performance
 * (one callback per threshold crossing instead of per scroll tick).
 */
export function useSectionView<T extends HTMLElement = HTMLElement>(
  section: SectionId,
  opts: { threshold?: number } = {}
) {
  const ref = useRef<T>(null)
  const enteredAt = useRef<number | null>(null)
  const hasFiredView = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const threshold = opts.threshold ?? 0.5

    const flushDwell = () => {
      if (enteredAt.current != null) {
        const dwell_ms = Math.round(performance.now() - enteredAt.current)
        if (dwell_ms > 0) trackSectionDwell(section, dwell_ms)
        enteredAt.current = null
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (enteredAt.current == null) {
            enteredAt.current = performance.now()
            if (!hasFiredView.current) {
              hasFiredView.current = true
              trackSectionView(section)
            }
          }
        } else {
          flushDwell()
        }
      },
      { threshold }
    )

    io.observe(el)

    const onHide = () => {
      if (document.visibilityState === "hidden") flushDwell()
    }
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", flushDwell)

    return () => {
      flushDwell()
      io.disconnect()
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", flushDwell)
    }
  }, [section, opts.threshold])

  return ref
}
