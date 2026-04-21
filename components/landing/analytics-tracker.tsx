"use client"

import { useEffect, useRef } from "react"
import {
  getViewedSections,
  trackPageExit,
  trackScrollDepth,
  trackTabVisibility,
} from "@/lib/analytics"

/**
 * Page-level engagement telemetry:
 *   - scroll_depth at 25/50/75/100 % (rAF-throttled, passive listener)
 *   - tab_visibility_change (visible / hidden with dwell delta)
 *   - page_exit with total_dwell_ms, max_scroll_pct, sections_viewed
 *
 * Section visibility is handled per-section via useSectionView
 * (IntersectionObserver) — NOT from this component.
 */
export function AnalyticsTracker() {
  const scrollMilestones = useRef<Set<number>>(new Set())
  const maxScrollPct = useRef(0)
  const mountedAt = useRef<number>(0)
  const lastVisibilityChange = useRef<number>(0)

  useEffect(() => {
    mountedAt.current = performance.now()
    lastVisibilityChange.current = performance.now()

    let ticking = false

    const computeScrollPct = () => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return 0
      return Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)))
    }

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const pct = computeScrollPct()
        if (pct > maxScrollPct.current) maxScrollPct.current = pct

        for (const milestone of [25, 50, 75, 100]) {
          if (pct >= milestone && !scrollMilestones.current.has(milestone)) {
            scrollMilestones.current.add(milestone)
            trackScrollDepth(milestone)
          }
        }
        ticking = false
      })
    }

    const handleVisibility = () => {
      const now = performance.now()
      const delta = Math.round(now - lastVisibilityChange.current)
      lastVisibilityChange.current = now
      trackTabVisibility(
        document.visibilityState === "hidden" ? "hidden" : "visible",
        delta
      )
    }

    const handleExit = () => {
      const total_dwell_ms = Math.round(performance.now() - mountedAt.current)
      trackPageExit({
        total_dwell_ms,
        max_scroll_pct: maxScrollPct.current,
        sections_viewed: getViewedSections().join(","),
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", handleExit)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", handleExit)
    }
  }, [])

  return null
}
