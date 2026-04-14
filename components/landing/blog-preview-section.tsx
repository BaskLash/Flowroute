"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const blogPosts = [
  {
    slug: "why-leaving-15-minutes-later-can-save-you-30-minutes",
    title: "Why Leaving 15 Minutes Later Can Save You 30 Minutes",
    excerpt:
      "Traffic waves are real, and understanding them can transform your commute. Learn how a small delay can lead to big time savings.",
    readTime: "5 min read",
  },
  {
    slug: "the-hidden-cost-of-daily-traffic",
    title: "The Hidden Cost of Daily Traffic (And How to Avoid It)",
    excerpt:
      "Breaking down the yearly time loss from traffic and how it impacts your life more than you realize.",
    readTime: "7 min read",
  },
  {
    slug: "stop-guessing-how-to-actually-beat-traffic",
    title: "Stop Guessing: How to Actually Beat Traffic in 2026",
    excerpt:
      "Why intuition fails and data-driven decisions are the key to smarter commuting.",
    readTime: "6 min read",
  },
]

export function BlogPreviewSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Insights on Traffic, Time & Smarter Commuting
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              {"Learn how small changes in timing can save hours every week."}
            </p>
          </div>
          <Button variant="outline" className="group shrink-0" asChild>
            <Link href="/blog">
              View all posts
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group block h-full rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/70"
              >
                <div className="text-sm text-muted-foreground">{post.readTime}</div>
                <h3 className="mt-3 text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-3 text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary">
                  Read more
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
