/**
 * The id the root route's `<link rel="expect">` render-blocks on, rendered as an
 * empty element directly after the prelayout script.
 *
 * A parser-blocking inline script only runs once the parser reaches it, and
 * streamed HTML arrives in chunks: the browser is free to paint a chunk boundary
 * that falls between the nav's markup and the script that lays it out — the
 * flash prelayout exists to prevent. Blocking the first render on an element
 * *after* the script closes that window.
 *
 * It marks the end of the script rather than the nav itself because `rel=expect`
 * unblocks rendering the moment the referenced element is fully parsed, so
 * pointing it at the `<nav>` would leave exactly the gap we're closing.
 */
export const PRELAYOUT_SENTINEL_ID = "main-nav-prelayout";
