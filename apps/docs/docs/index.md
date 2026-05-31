---
layout: home

hero:
  name: priority-plus
  text: Priority+ navigation, done properly
  tagline: A framework-agnostic core with small, idiomatic adapters for React, Svelte, and plain HTML.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is Priority+?
      link: /guide/what-is-priority-plus
    - theme: alt
      text: View on GitHub
      link: https://github.com/jayfreestone/priority-plus

features:
  - title: Framework-agnostic core
    details: All the measurement and layout maths live in @priority-plus/core. Adapters are thin shells that wire it to a runtime's lifecycle and renderer.
  - title: Idiomatic adapters
    details: A React hook and component, a Svelte 5 component, and a custom element for progressive enhancement — each measures, schedules, and renders the way its runtime expects.
  - title: Measure once, react to resize
    details: A shared engine owns the "re-measure vs. reuse cached measurements" decision and coalesces ResizeObserver bursts into a single layout per frame.
  - title: Bring your own markup
    details: Every adapter exposes class-name slots (or data attributes) so you control the DOM and styling. No bundled CSS, no opinions about your design system.
---
