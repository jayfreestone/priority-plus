import { createFileRoute } from "@tanstack/react-router";

// The script element is part of the hydrated tree here, so it must render
// identically on server and client — the ?raw import guarantees that (at the
// cost of the ~1 kB source also shipping in the route's JS). Joined with a
// newline so a trailing line comment in the source can never swallow the call.
import prelayoutSource from "@priority-plus/core/prelayout.iife.js?raw";

import { Nav } from "../nav";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>TanStack Start + prelayout</h1>
      <p>
        This page is server-rendered by TanStack Start. The inline script
        directly after the nav lays it out <em>before first paint</em>, long
        before hydration.
      </p>
      <Nav />
      <script
        dangerouslySetInnerHTML={{
          __html: `${prelayoutSource}\npriorityPlusPrelayout(document.getElementById("main-nav"))`,
        }}
      />
      <p>
        Throttle the network in devtools to widen the gap between paint and
        hydration — the nav is correctly collapsed the whole time.
      </p>
    </main>
  );
}
