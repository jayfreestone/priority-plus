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

### 2. The layout controller — measurement + state

The controller caches the last set of measurements and the container width, and
turns them into a [`PriorityPlusState`](/adapters/core#state)
(`visibleCount`, `overflowCount`, `allVisible`, …). It draws the important
distinction between two kinds of change: *the content changed* (widths must be
re-read) versus *only the available width changed* (a plain resize, so the
cached widths can be reused).

Each recalculation produces a result describing exactly what changed
(`visibleCountChanged`, `overflowCountChanged`, `measurementsChanged`, …) so
adapters can do the minimum work to update the DOM.

The controller — like the scheduling engine below — is internal to the layout
session; adapters never touch it directly.

### 3. The engine — the "re-measure vs. reuse" decision

The engine owns the scheduling bookkeeping: it coalesces a burst of layout
requests (e.g. a `ResizeObserver` firing for several observed elements) into
**one** layout on the next animation frame, remembering whether any caller
asked to re-measure, and decides whether to read fresh widths or reuse the
cache.

### 4. The layout session — the adapter interface

[`createPriorityPlusSession`](/adapters/core#the-layout-session) wraps the
controller and engine behind the one interface adapters use. Adapters supply
three DOM-facing hooks — `readMeasurements`, `getContainerInlineSize`, and
`onResult` — and the session handles the rest:

- **`observe(element, { refreshOnResize? })`** — watches sizes; container
  resizes reuse cached widths, measurer resizes re-measure.
- **`reset` / `setOptions` / `getState`** — the item set or options changed;
  read the current state on demand.
- **`refreshOnFontLoad()`** — re-measures once web fonts load; `destroy()`
  cancels it if still pending, along with all other pending work.

### 5. DOM helpers and the toggle presenter

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
ResizeObserver / font load / items change
        │
        ▼
   session.schedule()       ← coalesced into one frame
        │
        ▼
   readMeasurements()       ← only if re-measuring
        │
        ▼
   layout controller        ← cached widths + available width → state
        │
        ▼
   onResult(result)         ← adapter renders visible / overflow split
```

## When measurements must be re-read

Cached widths are reused for plain resizes. You only need fresh measurements
when something changes an item's *intrinsic* width:

- The set of items changes (adapters handle this for you).
- An item's label or content changes.
- A web font finishes loading — every adapter already re-measures on
  `document.fonts.ready`.
- Styling that affects intrinsic width changes at runtime.

The React hook exposes `update()`, the Svelte component re-measures when `items`
changes, and the custom element exposes `refresh()` plus a `MutationObserver`
for exactly these cases. Adapters also observe their hidden measurer with
`refreshOnResize`, so an item whose content grows re-fits automatically. See
each adapter for specifics.
