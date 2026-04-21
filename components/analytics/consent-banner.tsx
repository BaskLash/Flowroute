"use client"

import { useEffect, useState } from "react"
import {
  DEFAULT_DENIED_CONSENT,
  GRANTED_ALL_CONSENT,
  getStoredConsent,
  setStoredConsent,
} from "@/lib/analytics"
import { Button } from "@/components/ui/button"

export function ConsentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (getStoredConsent() === null) setShow(true)
  }, [])

  if (!show) return null

  const accept = () => {
    setStoredConsent(GRANTED_ALL_CONSENT)
    setShow(false)
  }

  const reject = () => {
    setStoredConsent(DEFAULT_DENIED_CONSENT)
    setShow(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-border/50 bg-background/95 backdrop-blur-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          We use cookies and similar technologies to analyse traffic and improve the product.
          You can accept all or reject non-essential.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reject}>
            Reject
          </Button>
          <Button size="sm" onClick={accept}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  )
}
