"use client"

import { useEffect, useRef } from "react"
import {
  trackBlogArticleComplete,
  trackBlogArticleRead,
  trackBlogArticleView,
  trackScrollDepth,
} from "@/lib/analytics"

interface BlogContentProps {
  content: string
  slug: string
  readTime?: string
}

/**
 * Parses read-time strings like "7 min read" → 7 (minutes). Default 5.
 */
function parseReadMinutes(label?: string): number {
  if (!label) return 5
  const match = label.match(/(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 5
}

export function BlogContent({ content, slug, readTime }: BlogContentProps) {
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

  const parseContent = (text: string) => {
    return text
      .split("\n\n")
      .map((block, index) => {
        if (block.startsWith("# ")) {
          return (
            <h1 key={index} className="mb-6 mt-12 text-3xl font-bold first:mt-0">
              {block.slice(2)}
            </h1>
          )
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="mb-4 mt-10 text-2xl font-semibold">
              {block.slice(3)}
            </h2>
          )
        }
        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="mb-3 mt-8 text-xl font-semibold">
              {block.slice(4)}
            </h3>
          )
        }

        if (block.trim() === "---") {
          return <hr key={index} className="my-8 border-border" />
        }

        if (block.startsWith("- ")) {
          const items = block.split("\n").filter((line) => line.startsWith("- "))
          return (
            <ul key={index} className="my-4 ml-6 list-disc space-y-2 text-muted-foreground">
              {items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {parseInlineStyles(item.slice(2))}
                </li>
              ))}
            </ul>
          )
        }

        if (/^\d+\.\s/.test(block)) {
          const items = block.split("\n").filter((line) => /^\d+\.\s/.test(line))
          return (
            <ol key={index} className="my-4 ml-6 list-decimal space-y-2 text-muted-foreground">
              {items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {parseInlineStyles(item.replace(/^\d+\.\s/, ""))}
                </li>
              ))}
            </ol>
          )
        }

        if (block.includes("|") && block.includes("---")) {
          const lines = block.split("\n").filter((line) => line.trim())
          const headers = lines[0]?.split("|").filter((cell) => cell.trim()) || []
          const rows = lines.slice(2).map((line) => line.split("|").filter((cell) => cell.trim()))

          return (
            <div key={index} className="my-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {headers.map((header, i) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold">
                        {header.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 text-muted-foreground">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        if (block.trim()) {
          return (
            <p key={index} className="my-4 text-muted-foreground leading-relaxed">
              {parseInlineStyles(block)}
            </p>
          )
        }

        return null
      })
      .filter(Boolean)
  }

  const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      const italicParts = part.split(/(\*[^*]+\*)/g)
      return italicParts.map((italicPart, j) => {
        if (
          italicPart.startsWith("*") &&
          italicPart.endsWith("*") &&
          !italicPart.startsWith("**")
        ) {
          return <em key={`${i}-${j}`}>{italicPart.slice(1, -1)}</em>
        }
        return italicPart
      })
    })
  }

  return <div className="prose prose-invert max-w-none">{parseContent(content)}</div>
}
