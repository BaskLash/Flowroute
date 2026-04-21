"use client"

import Link from "next/link"
import { Route } from "lucide-react"
import {
  trackLogoClick,
  trackNavClick,
  type NavPlacement,
} from "@/lib/analytics"

type FooterLink = {
  link_id: string
  link_text: string
  destination: string
  is_anchor: boolean
}

const PRODUCT_LINKS: FooterLink[] = [
  { link_id: "features", link_text: "Features", destination: "#features", is_anchor: true },
  { link_id: "how_it_works", link_text: "How it works", destination: "#how-it-works", is_anchor: true },
  { link_id: "try_it_now", link_text: "Try it now", destination: "#demo", is_anchor: true },
]

const RESOURCE_LINKS: FooterLink[] = [
  { link_id: "blog_index", link_text: "Blog", destination: "/blog", is_anchor: false },
  {
    link_id: "blog_traffic_tips",
    link_text: "Traffic Tips",
    destination: "/blog/why-leaving-15-minutes-later-can-save-you-30-minutes",
    is_anchor: false,
  },
  {
    link_id: "blog_commute_guide",
    link_text: "Commute Guide",
    destination: "/blog/the-hidden-cost-of-daily-traffic",
    is_anchor: false,
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { link_id: "privacy", link_text: "Privacy", destination: "#", is_anchor: false },
  { link_id: "terms", link_text: "Terms", destination: "#", is_anchor: false },
]

export function Footer() {
  const handleNav = (item: FooterLink, placement: NavPlacement = "footer") =>
    trackNavClick({
      link_id: item.link_id,
      link_text: item.link_text,
      destination: item.destination,
      placement,
      is_anchor: item.is_anchor,
    })

  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => trackLogoClick("footer")}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Route className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold tracking-tight">flowroute</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {"Stop wasting time in traffic. flowroute analyzes traffic patterns and tells you exactly when to leave."}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Product</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.link_id}>
                  <Link
                    href={item.destination}
                    onClick={() => handleNav(item)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.link_text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Resources</h3>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map((item) => (
                <li key={item.link_id}>
                  <Link
                    href={item.destination}
                    onClick={() => handleNav(item)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.link_text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} flowroute. All rights reserved.
          </p>
          <div className="flex gap-6">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.link_id}
                href={item.destination}
                onClick={() => handleNav(item)}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.link_text}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
