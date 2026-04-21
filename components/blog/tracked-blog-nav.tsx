"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  trackLogoClick,
  trackNavClick,
  type NavPlacement,
  type Placement,
} from "@/lib/analytics"

export function TrackedLogo({
  href,
  className,
  children,
  placement = "header",
}: {
  href: string
  className?: string
  children: ReactNode
  placement?: Placement
}) {
  return (
    <Link href={href} className={className} onClick={() => trackLogoClick(placement)}>
      {children}
    </Link>
  )
}

export function TrackedNavLink({
  href,
  link_id,
  link_text,
  is_anchor,
  placement = "header",
  className,
  children,
}: {
  href: string
  link_id: string
  link_text: string
  is_anchor: boolean
  placement?: NavPlacement
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackNavClick({
          link_id,
          link_text,
          destination: href,
          placement,
          is_anchor,
        })
      }
    >
      {children}
    </Link>
  )
}
