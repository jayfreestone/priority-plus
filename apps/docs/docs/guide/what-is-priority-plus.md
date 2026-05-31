# What is Priority+?

**Priority+** is a responsive navigation pattern. Instead of collapsing an
entire menu behind a hamburger button on small screens, you keep as many
top-level items visible as will fit, and move the rest into an overflow menu
revealed by a "More" toggle.

As the available width changes, items move between the **primary** list and the
**overflow** list so the navigation always fills the space without wrapping or
clipping:

```
Wide:    [ Dashboard ] [ Projects ] [ Reports ] [ Settings ] [ Billing ]

Medium:  [ Dashboard ] [ Projects ] [ Reports ] [ More (2) ]
                                                    └─ Settings, Billing

Narrow:  [ Dashboard ] [ More (4) ]
                          └─ Projects, Reports, Settings, Billing
```

The name comes from the idea that the most important ("priority") items stay
visible, and everything else is one interaction away behind the `+`.

## Why a library?

The pattern looks simple but the implementation is fiddly:

- You can't know which items fit without measuring their **rendered** widths,
  which means measuring off-screen so you don't see layout thrash.
- The toggle itself takes up space, so the fit calculation has to reserve room
  for it — but only when something actually overflows.
- You need to react to container resizes, font loading, and content changes
  without re-measuring more than necessary.

`priority-plus` solves this once in a framework-agnostic
[core](/adapters/core), then wraps it in small adapters that handle each
runtime's lifecycle and rendering idiomatically.

## The package split

| Package | Role |
| --- | --- |
| [`@priority-plus/core`](/adapters/core) | Pure layout calculation, state helpers, scheduling engine, and DOM measurement utilities. No framework, no rendering. |
| [`@priority-plus/react`](/adapters/react) | A `usePriorityPlus` hook and a `PriorityPlus` component. |
| [`@priority-plus/svelte`](/adapters/svelte) | A Svelte 5 `PriorityPlus` component. |
| [`priority-plus`](/adapters/custom-element) | A custom element for progressive enhancement of server-rendered markup. |

This mirrors the model used by projects like TanStack: shared logic lives in a
small core, while framework packages own measurement, lifecycle, and rendering.

Read [How It Works](/guide/how-it-works) for the mechanics, or jump straight to
an adapter:

- [React](/adapters/react)
- [Svelte](/adapters/svelte)
- [Custom Element](/adapters/custom-element)
- [Core](/adapters/core)
