"use client"

import { useEffect, useRef } from "react"
import {
  trackBlogArticleComplete,
  trackBlogArticleRead,
  trackBlogArticleView,
  trackScrollDepth,
} from "@/lib/analytics"

interface BlogArticleTrackerProps {
  slug: string
  readTime?: string
}

function parseReadMinutes(label?: string): number {
  if (!label) return 5
  const match = label.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 5
}

/**
 * Fires engagement events for a blog article page:
 *   - blog_article_view     on mount
 *   - scroll_depth          at 25/50/75/100 % of the article body
 *   - blog_article_read     at ≥75 % scroll AND ≥ readTime × 0.3 dwell
 *   - blog_article_complete at ≥95 % scroll
 *
 * Rendered next to the article markup — emits no DOM of its own.
 */
export function BlogArticleTracker({ slug, readTime }: BlogArticleTrackerProps) {
  const startedAt = useRef<number>(0)
  const readFired = useRef(false)
  const completeFired = useRef(false)
  const scrollMilestones = useRef<Set<number>>(new Set())

  useEffect(() => {
    startedAt.current = performance.now()
    trackBlogArticleView(slug, readTime)

    const minReadDwellMs = Math.round(parseReadMinutes(readTime) * 60 * 1000 * 0.3)

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const article = document.querySelector("article")
        if (!article) {
          ticking = false
          return
        }
        const rect = article.getBoundingClientRect()
        const scrollable = rect.height - window.innerHeight
        const scrolled = -rect.top
        const pct =
          scrollable > 0
            ? Math.min(100, Math.max(0, Math.round((scrolled / scrollable) * 100)))
            : 0

        for (const milestone of [25, 50, 75, 100]) {
          if (pct >= milestone && !scrollMilestones.current.has(milestone)) {
            scrollMilestones.current.add(milestone)
            trackScrollDepth(milestone)
          }
        }

        const dwell_ms = Math.round(performance.now() - startedAt.current)

        if (!readFired.current && pct >= 75 && dwell_ms >= minReadDwellMs) {
          readFired.current = true
          trackBlogArticleRead(slug, pct, dwell_ms)
        }

        if (!completeFired.current && pct >= 95) {
          completeFired.current = true
          trackBlogArticleComplete(slug)
        }

        ticking = false
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [slug, readTime])

  return null
}
