# priority-plus

A custom element for the [Priority+ navigation
pattern](https://css-tricks.com/the-priority-navigation-pattern/): items that
don't fit move into an overflow menu behind a toggle, recalculated as the
container resizes.

This adapter is built for **progressive enhancement**. You write ordinary
server-rendered navigation markup; the element measures and rearranges it in
place. If the script never loads, users still see a complete list of links.

```sh
npm install priority-plus
```

## Usage

```html
<priority-plus>
  <nav>
    <ul data-priority-plus-primary>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/projects">Projects</a></li>
      <li><a href="/reports">Reports</a></li>
    </ul>
    <button hidden data-priority-plus-toggle type="button">More</button>
    <ul hidden data-priority-plus-overflow></ul>
  </nav>
</priority-plus>

<script type="module">
  import "priority-plus";
</script>
```

Importing the package registers `<priority-plus>` automatically (use the
exported `definePriorityPlusElement("your-name")` for a custom tag name; the
import is safe in server-rendered module graphs, where it's a no-op).

- Re-syncs automatically when items change (`MutationObserver`), the container
  resizes (`ResizeObserver`), or web fonts load; call `refresh()` after content
  changes that only affect intrinsic widths.
- Exposes `itemCount` / `visibleCount` / `overflowCount` / `allVisible` /
  `state` accessors and emits `priority-plus:overflow-count-change`.
- ~3&nbsp;kB gzipped, no dependencies.

## Documentation

Full docs — required markup, styling, options, server rendering — live in the
[repository](https://github.com/jayfreestone/priority-plus): see the
[custom element guide](https://github.com/jayfreestone/priority-plus/blob/master/apps/docs/docs/adapters/custom-element.md).

React and Svelte adapters are published as
[`@priority-plus/react`](https://www.npmjs.com/package/@priority-plus/react) and
[`@priority-plus/svelte`](https://www.npmjs.com/package/@priority-plus/svelte),
with the framework-agnostic core at
[`@priority-plus/core`](https://www.npmjs.com/package/@priority-plus/core).

## License

[ISC](./LICENSE)
