# @priority-plus/core

The framework-agnostic core behind the
[`priority-plus`](https://www.npmjs.com/package/priority-plus) adapters: pure
fit calculation, item partitioning, toggle presentation, and a layout session
that owns the adapter lifecycle (measurement caching, frame coalescing,
`ResizeObserver`). ~1&nbsp;kB gzipped.

Most users want an adapter instead:
[`priority-plus`](https://www.npmjs.com/package/priority-plus) (custom
element), [`@priority-plus/react`](https://www.npmjs.com/package/@priority-plus/react),
or [`@priority-plus/svelte`](https://www.npmjs.com/package/@priority-plus/svelte).
This package is for building your own.

```sh
npm install @priority-plus/core
```

## Entry points

- `@priority-plus/core` — `createPriorityPlusSession` (the adapter lifecycle
  behind one interface), `createPriorityPlusState`, `partitionItems` /
  `planPartition`, and the toggle presenter (`presentToggle`,
  `defaultToggleLabel`, `widestToggleState`).
- `@priority-plus/core/dom` — `readCachedMeasurements` and
  `contentInlineSize`, the shared DOM measurement readers.
- `@priority-plus/core/prelayout` — the optional SSR pass: a render-blocking
  script that fits server-rendered markup **before first paint**, injecting
  only a scoped stylesheet so hydration stays clean. Also shipped as a classic
  script at `@priority-plus/core/prelayout.iife.js` for inlining. See the
  [server rendering guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/guide/ssr.md).

## Documentation

The [core adapter guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/adapters/core.md)
walks through the concepts (measurements, session, partition plans, the
enhanced attribute) and how the built-in adapters compose them.

## License

[ISC](./LICENSE)
