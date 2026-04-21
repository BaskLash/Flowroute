"use client"

import { sendGAEvent } from "@next/third-parties/google"

/* -----------------------------------------------------------------
 * GA4 Admin setup — REQUIRED (one-time, outside of code)
 * -----------------------------------------------------------------
 * These steps MUST be completed in the GA4 Admin UI. They cannot be
 * automated from application code.
 *
 * 1. Admin → Custom definitions → Create custom dimension:
 *      - cta_id       (Event scope, parameter: cta_id)
 *      - section      (Event scope, parameter: section)
 *      - placement    (Event scope, parameter: placement)
 *      - slug         (Event scope, parameter: slug)
 *      - feature_id   (Event scope, parameter: feature_id)
 *      - device_type  (Event scope, parameter: device_type)
 *      - cta_text     (Event scope, parameter: cta_text)
 *
 * 2. Admin → Events → Mark as key events:
 *      - demo_submit
 *      - demo_result_click
 *      - future_feature_interest
 *      - blog_article_read
 *
 * 3. Admin → Data Streams → (Web) → Configure tag settings →
 *    Consent settings: confirm Consent Mode v2 is active
 *    ("Redact Ads data when consent is denied" → ON).
 * ----------------------------------------------------------------- */

/* -------------------- Strict type unions -------------------- */

export type CtaId =
  | "check_my_route"
  | "see_when_to_leave"
  | "get_started"
  | "start_saving_time"
  | "compare_departure_times"
  | "view_all_posts"

export type Placement =
  | "header"
  | "hero"
  | "demo"
  | "cta_section"
  | "footer"
  | "mobile_menu"
  | "blog_card"
  | "blog_article"

export type SectionId =
  | "hero"
  | "impact"
  | "reality"
  | "problems"
  | "solution"
  | "demo"
  | "use_cases"
  | "future"
  | "blog_preview"
  | "cta_section"
  | "footer"

export type FutureFeatureId =
  | "calendar_integration"
  | "multi_stop_optimization"
  | "smart_notifications"
  | "ai_traffic_prediction"
  | "business_fleet_dashboards"

export type NavPlacement = "header" | "footer" | "mobile_menu"

export type DemoField = "origin" | "destination" | "time_window"

export type DemoResultStatus = "peak" | "moderate" | "optimal"

export type DeviceType = "mobile" | "tablet" | "desktop"

/* -------------------- Consent Mode v2 -------------------- */

export type ConsentState = "granted" | "denied"

export interface ConsentValues {
  ad_storage: ConsentState
  ad_user_data: ConsentState
  ad_personalization: ConsentState
  analytics_storage: ConsentState
  functionality_storage: ConsentState
  personalization_storage: ConsentState
  security_storage: ConsentState
}

export const CONSENT_STORAGE_KEY = "flowroute_consent_v1"

export const DEFAULT_DENIED_CONSENT: ConsentValues = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  personalization_storage: "denied",
  security_storage: "granted",
}

export const GRANTED_ALL_CONSENT: ConsentValues = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  personalization_storage: "granted",
  security_storage: "granted",
}

type GtagFn = (command: string, ...rest: unknown[]) => void

function getGtag(): GtagFn | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as { gtag?: GtagFn }
  return typeof w.gtag === "function" ? w.gtag : null
}

export function getStoredConsent(): ConsentValues | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ConsentValues) : null
  } catch {
    return null
  }
}

export function setStoredConsent(values: ConsentValues) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(values))
  } catch {
    /* storage may be disabled; consent mode update below still runs */
  }
  const gtag = getGtag()
  if (gtag) gtag("consent", "update", values)
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent()?.analytics_storage === "granted"
}

/* -------------------- Global params -------------------- */

function deviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop"
  const w = window.innerWidth
  if (w < 640) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

function baseParams(): Record<string, unknown> {
  if (typeof window === "undefined") {
    return { ts_client: Date.now() }
  }
  return {
    ts_client: Date.now(),
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    device_type: deviceType(),
    page_path: window.location.pathname,
  }
}

/* -------------------- Session-level aggregates -------------------- */

const viewedSections = new Set<SectionId>()

export function getViewedSections(): SectionId[] {
  return Array.from(viewedSections)
}

/* -------------------- Core wrapper -------------------- */

/**
 * Single entrypoint for every GA event emitted by the app.
 * Auto-appends: ts_client, viewport_w, viewport_h, device_type, page_path.
 * Gated by analytics consent — no events fire before user opts in.
 */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  if (!hasAnalyticsConsent()) return
  sendGAEvent("event", event, { ...baseParams(), ...params })
}

/* -------------------- CTA -------------------- */

export function trackCta(
  cta_id: CtaId,
  placement: Placement,
  extra: { cta_text?: string; destination?: string } = {}
) {
  track("cta_click", { cta_id, placement, ...extra })
}

export function trackCtaImpression(cta_id: CtaId, placement: Placement) {
  track("cta_impression", { cta_id, placement })
}

/* -------------------- Section visibility -------------------- */

export function trackSectionView(section: SectionId) {
  viewedSections.add(section)
  track("section_view", { section })
}

export function trackSectionDwell(section: SectionId, dwell_ms: number) {
  track("section_dwell", { section, dwell_ms })
}

/* -------------------- Navigation -------------------- */

export function trackNavClick(params: {
  link_id: string
  link_text: string
  destination: string
  placement: NavPlacement
  is_anchor: boolean
}) {
  track("nav_click", params)
}

export function trackMobileMenuToggle(state: "open" | "close") {
  track("mobile_menu_toggle", { state })
}

export function trackLogoClick(placement: Placement) {
  track("logo_click", { placement })
}

/* -------------------- Demo -------------------- */

export function trackDemoFieldFocus(field: DemoField) {
  track("demo_field_focus", { field })
}

export function trackDemoFieldChange(
  field: DemoField,
  has_value: boolean,
  value_length: number
) {
  track("demo_field_change", { field, has_value, value_length })
}

export function trackDemoSubmit(p: {
  origin_present: boolean
  destination_present: boolean
  time_window_present: boolean
  form_fill_ms: number
  attempt_number: number
}) {
  track("demo_submit", p)
}

export function trackDemoResultsView(p: { result_count: number; has_optimal: boolean }) {
  track("demo_results_view", p)
}

export function trackDemoResultClick(p: {
  result_index: number
  status: DemoResultStatus
  saved_minutes?: number
}) {
  track("demo_result_click", p)
}

export function trackDemoRetry(attempt_number: number) {
  track("demo_retry", { attempt_number })
}

/* -------------------- Future features -------------------- */

export function trackFutureFeatureInterest(feature_id: FutureFeatureId) {
  track("future_feature_interest", { feature_id, section: "future" })
}

/* -------------------- Blog -------------------- */

export function trackBlogPreviewClick(slug: string, position: number) {
  track("blog_preview_click", { slug, position, placement: "home" })
}

export function trackBlogAllPostsClick(placement: Placement = "blog_card") {
  track("blog_all_posts_click", { placement })
}

export function trackBlogArticleView(slug: string, read_time_label?: string) {
  track("blog_article_view", { slug, read_time_label })
}

export function trackBlogArticleRead(slug: string, scroll_pct: number, dwell_ms: number) {
  track("blog_article_read", { slug, scroll_pct, dwell_ms })
}

export function trackBlogArticleComplete(slug: string) {
  track("blog_article_complete", { slug })
}

export function trackBlogCtaClick(slug: string, cta_id: CtaId) {
  track("blog_cta_click", { slug, cta_id, placement: "blog_article" })
}

/* -------------------- Engagement quality -------------------- */

export function trackScrollDepth(percent: number) {
  track("scroll_depth", { percent })
}

export function trackTabVisibility(
  state: "hidden" | "visible",
  dwell_ms_since_last_change: number
) {
  track("tab_visibility_change", { state, dwell_ms_since_last_change })
}

export function trackRageClick(element_id: string, section: SectionId | "unknown") {
  track("rage_click", { element_id, section })
}

export function trackPageExit(p: {
  total_dwell_ms: number
  max_scroll_pct: number
  sections_viewed: string
}) {
  track("page_exit", p)
}
