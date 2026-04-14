"use client"

import { useEffect, useRef } from "react"
import { sendGAEvent } from "@next/third-parties/google"

interface BlogContentProps {
  content: string
  slug: string
}

export function BlogContent({ content, slug }: BlogContentProps) {
  const startTime = useRef<number>(Date.now())
  const scrollMilestones = useRef<Set<number>>(new Set())

  useEffect(() => {
    // Track blog click
    sendGAEvent("event", "blog_click", {
      event_category: "blog",
      event_label: slug,
    })

    const handleScroll = () => {
      const articleElement = document.querySelector("article")
      if (!articleElement) return

      const rect = articleElement.getBoundingClientRect()
      const scrollHeight = rect.height - window.innerHeight
      const scrolled = -rect.top
      const scrollPercent = Math.min(100, Math.max(0, Math.round((scrolled / scrollHeight) * 100)))

      const milestones = [25, 50, 75, 100]
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone)
          sendGAEvent("event", "blog_scroll_depth", {
            event_category: "blog",
            event_label: slug,
            value: milestone,
          })
        }
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    // Track time on page when leaving
    return () => {
      window.removeEventListener("scroll", handleScroll)
      const timeOnPage = Math.round((Date.now() - startTime.current) / 1000)
      sendGAEvent("event", "blog_time_on_page", {
        event_category: "blog",
        event_label: slug,
        value: timeOnPage,
      })
    }
  }, [slug])

  // Parse markdown-like content to HTML
  const parseContent = (text: string) => {
    return text
      .split("\n\n")
      .map((block, index) => {
        // Headers
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

        // Horizontal rule
        if (block.trim() === "---") {
          return <hr key={index} className="my-8 border-border" />
        }

        // Lists
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

        // Numbered lists
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

        // Tables
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

        // Regular paragraphs
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
    // Handle bold
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        )
      }
      // Handle italic
      const italicParts = part.split(/(\*[^*]+\*)/g)
      return italicParts.map((italicPart, j) => {
        if (italicPart.startsWith("*") && italicPart.endsWith("*") && !italicPart.startsWith("**")) {
          return <em key={`${i}-${j}`}>{italicPart.slice(1, -1)}</em>
        }
        return italicPart
      })
    })
  }

  return (
    <div className="prose prose-invert max-w-none">
      {parseContent(content)}
    </div>
  )
}
