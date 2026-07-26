import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

import { PRELAYOUT_SENTINEL_ID } from "../prelayout-sentinel";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "priority-plus — TanStack Start prelayout demo" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Hold the first paint until the prelayout script has run; see
      // prelayout-sentinel.ts. Rendering is unblocked at end of parse
      // regardless, so a route without the nav can't hang.
      {
        rel: "expect",
        href: `#${PRELAYOUT_SENTINEL_ID}`,
        blocking: "render",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
