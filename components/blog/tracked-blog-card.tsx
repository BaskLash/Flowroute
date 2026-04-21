"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { trackBlogPreviewClick } from "@/lib/analytics"

interface TrackedBlogCardProps {
  slug: string
  position: number
  href: string
  className?: string
  children: ReactNode
}

/**
 * Client wrapper around <Link> that emits `blog_preview_click`
 * from inside server-rendered blog index pages.
 */
export function TrackedBlogCard({
  slug,
  position,
  href,
  className,
  children,
}: TrackedBlogCardProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackBlogPreviewClick(slug, position)}
    >
      {children}
    </Link>
  )
}
