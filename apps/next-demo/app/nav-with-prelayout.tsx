// Server Component (no "use client"): the inline script is emitted into the
// server HTML only — it never enters the client bundle or the hydrated tree,
// so there is nothing for hydration to mismatch on.
//
// The raw-source import is wired up by the `*.iife.js` raw-loader rule in
// next.config.ts.
// @ts-expect-error — resolved as source text by the raw-loader rule, which
// TypeScript can't see past the real (non-module) .js file.
import prelayoutSource from "@priority-plus/core/prelayout.iife.js";

import { Nav } from "./nav";

/**
 * The id the root layout's `<link rel="expect">` render-blocks on. It marks the
 * end of the prelayout script, not the nav: `rel=expect` unblocks rendering the
 * moment the referenced element is fully parsed, so pointing it at the `<nav>`
 * would still leave the streaming gap between `</nav>` and the script's closing
 * tag — the gap we're trying to close.
 */
export const PRELAYOUT_SENTINEL_ID = "main-nav-prelayout";

export function NavWithPrelayout() {
  return (
    <>
      <Nav />
      <script
        dangerouslySetInnerHTML={{
          // Join with a newline so a trailing line comment in the source can
          // never swallow the call.
          __html: `${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))`,
        }}
      />
      {/* Parsed only after the script above has run. Never rendered; only its
          presence in the DOM matters. */}
      <div id={PRELAYOUT_SENTINEL_ID} hidden />
    </>
  );
}
