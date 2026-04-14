"use client"

import { useEffect, useRef } from "react"
import { sendGAEvent } from "@next/third-parties/google"

export function AnalyticsTracker() {
  const scrollMilestones = useRef<Set<number>>(new Set())

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100)

      const milestones = [25, 50, 75, 100]
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone)
          sendGAEvent("event", "scroll_depth", {
            percent: milestone,
          })
        }
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return null
}

export function trackCTAClick(ctaName: string) {
  sendGAEvent("event", ctaName, {
    event_category: "cta",
    event_label: ctaName,
  })
}

export function trackBlogClick(slug: string) {
  sendGAEvent("event", "blog_click", {
    event_category: "blog",
    event_label: slug,
  })
}
