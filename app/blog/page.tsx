import { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Route } from "lucide-react"
import { blogPosts } from "@/lib/blog-data"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Blog | flowroute",
  description: "Insights on traffic, time, and smarter commuting. Learn how small changes in timing can save hours every week.",
  openGraph: {
    title: "Blog | flowroute",
    description: "Insights on traffic, time, and smarter commuting.",
    type: "website",
  },
}

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Route className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">flowroute</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Insights on Traffic, Time & Smarter Commuting
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {"Learn how small changes in timing can save hours every week."}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <article key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/70"
              >
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  Read article
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Route className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">flowroute</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} flowroute. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
