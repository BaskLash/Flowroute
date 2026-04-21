"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Menu, X, Route } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  trackCta,
  trackLogoClick,
  trackMobileMenuToggle,
  trackNavClick,
  type NavPlacement,
} from "@/lib/analytics"

type HeaderNavItem = {
  link_id: string
  link_text: string
  destination: string
  is_anchor: boolean
}

const NAV_ITEMS: HeaderNavItem[] = [
  { link_id: "features", link_text: "Features", destination: "#features", is_anchor: true },
  { link_id: "how_it_works", link_text: "How it works", destination: "#how-it-works", is_anchor: true },
  { link_id: "blog", link_text: "Blog", destination: "/blog", is_anchor: false },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (item: HeaderNavItem, placement: NavPlacement) => {
    trackNavClick({
      link_id: item.link_id,
      link_text: item.link_text,
      destination: item.destination,
      placement,
      is_anchor: item.is_anchor,
    })
  }

  const toggleMobileMenu = () => {
    const next = !mobileMenuOpen
    setMobileMenuOpen(next)
    trackMobileMenuToggle(next ? "open" : "close")
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => trackLogoClick("header")}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Route className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">flowroute</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.link_id}
              href={item.destination}
              onClick={() => handleNavClick(item, "header")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.link_text}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="#demo"
              onClick={() =>
                trackCta("check_my_route", "header", {
                  cta_text: "Check My Route",
                  destination: "#demo",
                })
              }
            >
              Check My Route
            </Link>
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <Link
              href="#demo"
              onClick={() =>
                trackCta("get_started", "header", {
                  cta_text: "Get Started",
                  destination: "#demo",
                })
              }
            >
              Get Started
            </Link>
          </Button>
        </div>

        <button
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/50 bg-background md:hidden"
        >
          <div className="flex flex-col gap-4 px-4 py-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.link_id}
                href={item.destination}
                onClick={() => {
                  handleNavClick(item, "mobile_menu")
                  setMobileMenuOpen(false)
                  trackMobileMenuToggle("close")
                }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.link_text}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href="#demo"
                  onClick={() =>
                    trackCta("check_my_route", "mobile_menu", {
                      cta_text: "Check My Route",
                      destination: "#demo",
                    })
                  }
                >
                  Check My Route
                </Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground" asChild>
                <Link
                  href="#demo"
                  onClick={() =>
                    trackCta("get_started", "mobile_menu", {
                      cta_text: "Get Started",
                      destination: "#demo",
                    })
                  }
                >
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
