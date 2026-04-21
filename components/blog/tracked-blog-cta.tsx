"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { trackBlogCtaClick, type CtaId } from "@/lib/analytics"

interface TrackedBlogCtaProps {
  href: string
  slug: string
  cta_id: CtaId
  className?: string
  children: ReactNode
}

export function TrackedBlogCta({
  href,
  slug,
  cta_id,
  className,
  children,
}: TrackedBlogCtaProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackBlogCtaClick(slug, cta_id)}
    >
      {children}
    </Link>
  )
}
