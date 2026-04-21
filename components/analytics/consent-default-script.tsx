import Script from "next/script"

/**
 * Google Consent Mode v2 bootstrap.
 *
 * Must load BEFORE the GA tag. It:
 *   1. Initialises window.dataLayer and window.gtag.
 *   2. Reads any previously-stored consent from localStorage.
 *   3. Sends `gtag('consent', 'default', ...)` — denied for all
 *      analytics/ad categories unless the user has already opted in.
 *
 * Placed in the root layout with `beforeInteractive` so it executes
 * prior to the GA4 library provided by @next/third-parties.
 */
export function ConsentDefaultScript() {
  return (
    <Script id="gtag-consent-default" strategy="beforeInteractive">
      {`
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  var denied = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted'
  };
  var stored = null;
  try {
    var raw = localStorage.getItem('flowroute_consent_v1');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}
  var initial = stored || denied;
  gtag('consent', 'default', Object.assign({ wait_for_update: 500 }, initial));
})();
      `}
    </Script>
  )
}
