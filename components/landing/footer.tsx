import Link from "next/link"
import { Route } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
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
              <li>
                <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#demo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Try it now
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/blog/why-leaving-15-minutes-later-can-save-you-30-minutes" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Traffic Tips
                </Link>
              </li>
              <li>
                <Link href="/blog/the-hidden-cost-of-daily-traffic" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Commute Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} flowroute. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
