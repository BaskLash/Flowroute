import { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, Route, Clock, Calendar } from "lucide-react"
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog-data"
import { Button } from "@/components/ui/button"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { BlogArticleTracker } from "@/components/blog/blog-article-tracker"
import { TrackedBlogCta } from "@/components/blog/tracked-blog-cta"
import {
  TrackedLogo,
  TrackedNavLink,
} from "@/components/blog/tracked-blog-nav"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

function renderMarkdown(content: string) {
  const lines = content.trimStart().split("\n")
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let isFirstLine = true

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="flex flex-col gap-2 pl-6 list-disc">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  const formatInline = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary underline hover:opacity-80 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>'
      )

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // ✅ Skip first H1 (title duplication fix)
    if (isFirstLine && trimmed.startsWith("# ")) {
      isFirstLine = false
      return
    }
    isFirstLine = false

    if (trimmed === "---") {
      flushList()
      elements.push(<hr key={`hr-${i}`} className="my-8 border-border" />)
    } else if (trimmed.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl sm:text-3xl mt-12 mb-6 font-bold">
          {trimmed.replace("## ", "")}
        </h2>
      )
    } else if (trimmed.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl sm:text-2xl mt-8 mb-4 font-semibold">
          {trimmed.replace("### ", "")}
        </h3>
      )
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const itemContent = trimmed.replace(/^[-*] /, "")
      listItems.push(
        <li key={`li-${i}`}>
          <span dangerouslySetInnerHTML={{ __html: formatInline(itemContent) }} />
        </li>
      )
    } else if (trimmed === "") {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={`p-${i}`} className="my-4 text-muted-foreground leading-relaxed">
          <span dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
        </p>
      )
    }
  })

  flushList()
  return elements
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return {
      title: "Post Not Found | flowroute",
    }
  }

  return {
    title: `${post.title} | flowroute Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <BlogArticleTracker slug={post.slug} readTime={post.readTime} />

      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <TrackedLogo href="/" className="flex items-center gap-2" placement="header">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Route className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">flowroute</span>
          </TrackedLogo>
          <Button variant="ghost" size="sm" asChild>
            <TrackedNavLink
              href="/blog"
              link_id="all_posts"
              link_text="All Posts"
              is_anchor={false}
              placement="header"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              All Posts
            </TrackedNavLink>
          </Button>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <article>
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Route className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{post.author}</div>
                <div className="text-sm text-muted-foreground">flowroute</div>
              </div>
            </div>
          </header>

          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:opacity-80 prose-li:text-muted-foreground">
            {renderMarkdown(post.content)}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to optimize your commute?</h2>
          <p className="mt-2 text-muted-foreground">
            {"Stop wasting time in traffic. Start leaving at the right time."}
          </p>
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
            <TrackedBlogCta
              href="/#demo"
              slug={post.slug}
              cta_id="check_my_route"
            >
              Try flowroute Now
            </TrackedBlogCta>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <TrackedLogo href="/" className="flex items-center gap-2" placement="footer">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Route className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">flowroute</span>
            </TrackedLogo>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} flowroute. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}