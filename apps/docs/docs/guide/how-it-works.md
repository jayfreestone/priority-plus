# How It Works

Every adapter is a thin shell around the same pieces of
[`@priority-plus/core`](/adapters/core). Understanding them makes the adapter
APIs — and their quirks — obvious.

## The problem

To decide how many items fit, you need their **rendered** widths. You can't get
those from the data; you have to measure real DOM. But the visible list is
constantly changing as items move in and out of overflow, so measuring it
directly would be circular and would thrash the layout.

`priority-plus` solves this with a **hidden measurer**: an off-screen copy of
the full list (plus the toggle) that always contains every item at its natural
width. The widths come from there; the visible list is then derived.

## The pieces

### 1. The fit calculation — the pure maths

Given a set of [measurements](/adapters/core#measurements) — item widths, the
gaps between them, the toggle width, and the available space — it returns how
many leading items fit:

- If **every** item fits without the toggle, all of them stay visible.
- Otherwise it reserves room for the toggle **at its widest** and keeps the
  leading items that fit. Because width only grows as items are added, the
  first item that overflows ends the primary list.

This is a pure function — no DOM, no state — which makes the core trivially
testable.

### 2. The layout session — the adapter interface

[`createPriorityPlusSession`](/adapters/core#the-layout-session) is the one
interface adapters build on. Internally it caches the last set of measurements
and the container width, drawing the important distinction between two kinds of
change:

- **The content changed** — widths must be re-read from the DOM.
- **Only the available width changed** (a plain resize) — the cached widths are
  reused, and no element is touched.

It also owns the scheduling: bursts of layout requests (e.g. a
`ResizeObserver` firing for several observed elements) coalesce into **one**
layout on the next animation frame, remembering whether any caller asked to
re-measure.

Adapters supply three DOM-facing hooks — `readMeasurements`,
`getContainerInlineSize`, and `onResult` — plus their wiring decisions:

- **`observe(element, { refreshOnResize? })`** — container resizes reuse cached
  widths; measurer resizes re-measure.
- **`reset` / `setOptions`** — the item set or options changed.
- **`getState()`** — read the current state on demand; every recalculation is
  delivered through `onResult`, the single notification path.

Each result describes exactly what changed (`visibleCountChanged`,
`overflowCountChanged`, `measurementsChanged`, …) so adapters can do the
minimum work to update the DOM.

### 3. DOM helpers and the toggle presenter

`readCachedMeasurements` reads the cached-measurement shape from a set of
elements in exactly one place, so every adapter builds it identically and only
decides *which* elements to point it at. `contentInlineSize` normalises the
box-model arithmetic.

[`presentToggle`](/adapters/core#the-toggle-presenter) derives what the toggle
and overflow actually render — `aria-expanded`, the hidden flags — from the
user's open intent plus the current state, so the accessibility contract is
identical across adapters.

## Putting it together

```
ResizeObserver / items change
        │
        ▼
   session.schedule()       ← coalesced into one frame
        │
        ▼
   readMeasurements()       ← only if re-measuring
        │
        ▼
   recalculate              ← cached widths + available width → state
        │
        ▼
   onResult(result)         ← adapter renders visible / overflow split
```

## When measurements must be re-read

Cached widths are reused for plain resizes. You only need fresh measurements
when something changes an item's *intrinsic* width:

- The set of items changes (adapters handle this for you).
- An item's label or content changes.
- A web font finishes loading.
- Styling that affects intrinsic width changes at runtime.

The React and Svelte adapters observe their hidden measurer with
`refreshOnResize`, so all of these — including font loads, which resize the
measurer when the new metrics land — re-fit automatically. The custom element
has no persistent measurer, so it watches its light DOM with a
`MutationObserver`, re-measures once on `document.fonts.ready`, and exposes
`refresh()` for anything else. The React hook also exposes `update()` for
imperative cases.

## What about SSR?

Everything above needs a browser, so server output renders the optimistic
all-visible state, and on the client the first measured layout lands before
paint. The one gap is server-rendered pages on slow connections — the markup
paints long before the bundle hydrates. The
[Server Rendering guide](/guide/ssr) covers the render-blocking prelayout pass
that closes it.
