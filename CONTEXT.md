# Context

Domain vocabulary for priority-plus. These are the nouns the code is named
after; use them in commits, reviews, and future architecture work so names stay
stable.

## Concepts

**Item** — one navigation entry. Lives either in the **primary** list or the
**overflow** list, never both.

**Primary** — the visible, inline list of items.

**Overflow** — the list of items that did not fit; revealed by the **toggle**.

**Toggle** — the control that opens the overflow list. The fit calculation
always reserves room for it, measured at its widest.

**Measurements** — the widths and gaps the fit calculation needs: item widths,
the item gap, the container gap, the toggle width, and the available inline
size. `PriorityPlusMeasurements` carries `available`; the cached form
(`PriorityPlusCachedMeasurements`) drops it and stores the primary list's own
non-content inline size instead, so `available` can be re-derived from the live
container width on every resize without re-measuring. `inflateMeasurements`
performs that re-derivation; the split and the join live together in
`calculate.ts`.

**Visible count** — how many leading items fit in the primary list. Everything
after it overflows. The pure fit math lives in `calculate.ts`.

**Collapse-at-count** — an option: when the fitted primary count is at or below
this threshold, collapse every item into overflow to avoid orphans.

**State** — the derived snapshot the UI renders from: item count, visible count,
overflow count, all-visible flag.

**Layout controller** — the stateful owner of cached measurements and change
detection. Given measurements and a container size, it recomputes **state** and
reports which fields changed.

**Engine** — owns the "re-measure vs. reuse cached measurements" decision and
coalesces bursts of layout requests into one per animation frame.

**Layout session** — the whole adapter lifecycle behind one interface
(`createPriorityPlusSession`), and the *only* door: the layout controller and
engine are private to it. Adapters supply the DOM-facing hooks (read
measurements, read container size, apply result), decide which elements to
`observe` (and whether each one's resize should re-measure), and call `reset` /
`setOptions` from their own reactivity; `getState` reads the current snapshot on
demand. The session also owns the `ResizeObserver` and the font-load reflow —
`destroy` cancels a still-pending font callback, so adapters keep no disposers.
Everything an adapter would otherwise re-wire by hand — and get subtly wrong —
is shared here.

**Partition plan** — the change in item placement between two visible counts,
expressed as item indices (`planPartition` → promote / demote / rebuild / none).
Adapters that move live DOM nodes (the custom element) execute the plan; the
index arithmetic stays pure and tested in `partition.ts`, alongside
`partitionItems`, the slicing form used by adapters that re-render (React,
Svelte).

**Toggle presenter** — the pure derivation of what the toggle and overflow
render (`presentToggle` in `toggle.ts`): `expanded` (what `aria-expanded`
reflects — never true when all items are visible), toggle hidden, overflow
hidden. Adapters store only the open *intent* in their own reactivity and reset
it when everything becomes visible; every derived output comes from the
presenter so the adapters cannot drift. `defaultToggleLabel` (clamped) and
`widestToggleState` (the state a measurer renders the toggle with) live with
it.

**Adapter** — a framework-specific wrapper around the core: the custom element,
the React hook/component, the Svelte component. Each owns element acquisition
and rendering; the **layout session** owns the lifecycle they share.
