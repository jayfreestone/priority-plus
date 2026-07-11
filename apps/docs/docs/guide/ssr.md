# Server Rendering

Priority+ needs real measurements, and measuring needs a browser. That's fine
for client-side rendering — but with SSR, your markup paints long before your
JavaScript runs. This page covers what happens in each case, and the
**prelayout** pass that closes the SSR gap.

## Client-side rendering: nothing to do

When the React or Svelte adapter renders on the client, the first measured
layout is committed **before the browser paints**: the initial all-visible
render, the measurement, and the corrected layout all happen in the same frame.
There is no flash, and nothing to configure.

## The SSR gap

Server-rendered HTML paints immediately — that's the point of SSR. The adapter
can't measure until the bundle loads and hydrates, so the server output renders
the optimistic state: **every item visible, no toggle**. On a slow connection
that's seconds of a wrapped or overflowing nav.

No framework adapter can fix this from inside the bundle; the gap is between
first paint and script delivery. Hiding the nav with `visibility: hidden` until
hydration "works", but it forfeits the reason you server-rendered it.

## Prelayout

`@priority-plus/core/prelayout` is a tiny (~1&nbsp;kB) render-blocking pass that
lays out the server markup **before first paint**, from an inline script placed
directly after it:

```html
<nav>…server-rendered PriorityPlus output…</nav>
<script>
  priorityPlusPrelayout(document.currentScript.previousElementSibling);
</script>
```

Because the script is parser-blocking, it runs after the nav is parsed and
before anything paints — the technique from
[intentional render-blocking JavaScript](https://www.jayfreestone.com/writing/intentional-render-blocking-javascript/).

Two ways to get the function there:

- **The classic script** — `@priority-plus/core/dist/prelayout.iife.js` exposes
  `window.priorityPlusPrelayout`. Inline its contents into the `<script>`
  above, or load it render-blocking (no `defer`/`module`) in `<head>`.
- **The module** — `import { prelayout } from "@priority-plus/core/prelayout"`
  for toolchains that can inline module code ahead of paint (e.g. Astro's
  `is:inline`).

### How it works

The server output already includes the [hidden
measurer](/guide/how-it-works#the-problem) — every item at natural width, plus
the toggle at its widest. Prelayout measures those exact elements and runs the
same fit calculation the adapter will run after hydration, so the two agree.

Crucially, it **mutates nothing the framework owns** — not even an attribute,
which hydration would report as a mismatch. Instead it injects a stylesheet
into `<head>` that hides the overflowed items and reveals the toggle (copying
the display value from the toggle's measurer twin), scoped to the nav by its
position in the document.

Every injected rule is guarded by `:not([data-priority-plus-enhanced])`. The
adapters render that attribute with their first measured layout — before
paint — so the interim styles dissolve exactly as the real structural layout
takes over. When the measurements agree, the handover is pixel-identical.

### API

```ts
prelayout(container, options?);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `container` | `Element \| null \| undefined` | The rendered `<nav>`. `document.currentScript.previousElementSibling` in the inline pattern. |
| `options.collapseAtCount` | `number` | Optional override. When omitted, prelayout reads the `data-priority-plus-collapse-at` attribute the adapters render from their prop, so the option is specified once. |

Returns the computed [state](/adapters/core#state), or `null` when it bailed.
It's a silent no-op whenever acting would be wrong: everything fits, the
expected markup is missing, or the container isn't laid out. A failed prelayout
degrades to exactly what you'd have without it.

### Requirements

- The nav's layout-affecting CSS must arrive **before** the script runs.
  Stylesheets in `<head>` block script execution, so `<link>` and inline
  `<style>` are both fine; styles injected later by your bundle are not.
- Don't set `display` on the toggle's class — an author `display` overrides the
  `hidden` attribute entirely (in every adapter, not just here). Let the
  container's flex layout place it.
- The adapters stamp the markup contract automatically
  (`data-priority-plus-primary` / `-toggle` / `-measurer`); if you build custom
  markup with [`usePriorityPlus`](/adapters/react#usepriorityplus), stamp those
  attributes yourself for prelayout to find.

## Framework recipes

The pattern is the same everywhere — get the classic script's source into the
document, inline, after the nav — but each framework has its own way to render
a raw script tag. The Next.js and TanStack Start recipes below are working
apps in the repository
([`apps/next-demo`](https://github.com/jayfreestone/priority-plus/tree/master/apps/next-demo),
[`apps/start-demo`](https://github.com/jayfreestone/priority-plus/tree/master/apps/start-demo)).
Three shared conventions first:

- **Look the nav up by `id`** rather than `previousElementSibling`. Frameworks
  stream and wrap output, so sibling relationships are less dependable than in
  hand-written HTML. Both adapters spread extra attributes onto the `<nav>`,
  so pass `id` straight through.
- **Join the source and the call with a newline**, not just a semicolon. If
  the script's source ever ends in a line comment (a
  `//# sourceMappingURL` is the classic), a same-line call is silently
  commented out — the global gets defined and nothing ever runs.
- **In Vite-based frameworks**, import the script's source as a string with
  `?raw`:

  ```ts
  import prelayoutSource from "@priority-plus/core/prelayout.iife.js?raw";
  ```

### Next.js (App Router)

Render the script from a **Server Component** wrapping your client nav. Client
components still server-render their HTML, and a server component's script tag
never enters the client bundle or the hydrated tree.

Next has no `?raw` imports, so wire up a raw-loader rule (add `raw-loader` as
a dev dependency):

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.iife.js": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};
```

```tsx
// app/nav-with-prelayout.tsx — Server Component (no "use client")

// @ts-expect-error — resolved as source text by the raw-loader rule, which
// TypeScript can't see past the real (non-module) .js file.
import prelayoutSource from "@priority-plus/core/prelayout.iife.js";

import { Nav } from "./nav"; // your "use client" component rendering <PriorityPlus id="main-nav" …>

export function NavWithPrelayout() {
  return (
    <>
      <Nav />
      <script
        dangerouslySetInnerHTML={{
          __html: `${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))`,
        }}
      />
    </>
  );
}
```

Two approaches that look right but aren't: `next/script` with
`beforeInteractive` hoists into `<head>`, which runs before the nav exists;
and reading the file with `fs` + `createRequire(...).resolve(...)` fails under
Turbopack, which rewrites `require.resolve` into an internal module id that
`readFileSync` then treats as a file descriptor.

### TanStack Start

Start routes are ordinary React components that server-render and hydrate, so
render the script inline in the route. Because the script element is part of
the hydrated tree here, it must render identically on server and client — the
`?raw` import guarantees that (at the cost of the ~1&nbsp;kB source also
shipping in the route's JS):

```tsx
import prelayoutSource from "@priority-plus/core/prelayout.iife.js?raw";

function Header() {
  return (
    <>
      <Nav id="main-nav" />
      <script
        dangerouslySetInnerHTML={{
          __html: `${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))`,
        }}
      />
    </>
  );
}
```

### SvelteKit

Emit the script with `{@html}`. During SSR the string lands in the document
and executes as parsed; on the client, Svelte claims the markup without
re-executing it (scripts inserted via `innerHTML` don't run). Escape the
closing tag so the Svelte compiler doesn't end your script block early:

```svelte
<script lang="ts">
  import prelayoutSource from "@priority-plus/core/prelayout.iife.js?raw";
  import { PriorityPlus } from "@priority-plus/svelte";

  const { items } = $props();
</script>

<PriorityPlus id="main-nav" {items}>
  {#snippet children(item)}
    <a href={item.href}>{item.label}</a>
  {/snippet}
</PriorityPlus>

{@html `<script>${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))<\/script>`}
```

### Astro

For framework islands (`client:load`), Astro server-renders the HTML and
hydrates later — the same gap. Inline the pass with `is:inline`:

```astro
---
import prelayoutSource from "@priority-plus/core/prelayout.iife.js?raw";
---
<Nav client:load id="main-nav" />
<script
  is:inline
  set:html={`${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))`}
/>
```

### Dev servers

In development, Vite-style servers inject CSS through JavaScript, so the nav's
styles may not be applied when the blocking script runs — prelayout will
measure unstyled markup or bail. That's expected and harmless (hydration
corrects it); judge the behaviour in a production build, like the
[demo](#try-it) does. Static pre-rendering (SSG) behaves identically to SSR
here: what matters is that real markup is in the document before the bundle.

### Trade-offs

::: warning Overflowed items are hidden until hydration
Without prelayout, a never-arriving bundle degrades to all items visible. With
it, users see the fitted items and an inert toggle — the overflow is
unreachable until hydration. If that trade-off is wrong for your site, don't
run prelayout; the default degradation is the safer one.
:::

- **Counted toggle labels show a stale count.** Prelayout can restyle but not
  rewrite text, so a `More (3)`-style label renders the server's placeholder
  count until hydration. Prefer a count-free label (`More ▾`) when using
  prelayout.
- **Web fonts land later.** Prelayout measures fallback metrics; the usual
  measurer-driven re-fit corrects the layout once fonts settle. `size-adjust`
  on your fallback font minimises the shift. This is true of any
  measure-before-fonts approach, including fully client-side ones.
- **The interim layout is static.** Resizing the viewport before hydration
  won't re-fit; the first hydrated layout catches up.

## The custom element

The custom element doesn't use prelayout — it has no measurer, and its
[required markup](/adapters/custom-element#required-markup) is already the
progressive-enhancement state: all items visible, toggle hidden, usable without
JavaScript. To keep the pre-enhancement paint tidy, style the un-enhanced state
via the `data-priority-plus-enhanced` attribute the element sets once it has
measured:

```css
priority-plus:not([data-priority-plus-enhanced]) [data-priority-plus-primary] {
  flex-wrap: nowrap;
  overflow: clip; /* items that don't fit are cleanly cut off, not wrapped */
}
```

## Try it

The repository contains three runnable demos:

- [`apps/ssr-demo`](https://github.com/jayfreestone/priority-plus/tree/master/apps/ssr-demo) —
  the mechanism, minimally: a page pre-rendered at build time with the script
  inlined and hydration on an artificial delay. Use `?delay=8000` to slow the
  bundle down and `?no-prelayout` to see the flash it prevents.

  ```sh
  npx turbo run build --filter @priority-plus/ssr-demo
  npm run preview -w @priority-plus/ssr-demo
  ```

- [`apps/next-demo`](https://github.com/jayfreestone/priority-plus/tree/master/apps/next-demo)
  and
  [`apps/start-demo`](https://github.com/jayfreestone/priority-plus/tree/master/apps/start-demo) —
  the Next.js and TanStack Start recipes above as working apps. Build the
  workspace packages first (`npm run build`), then `npm run demo:build` and
  `npm run demo:start` in either app and throttle the network in devtools.
