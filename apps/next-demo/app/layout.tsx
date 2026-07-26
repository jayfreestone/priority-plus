import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { PRELAYOUT_SENTINEL_ID } from "./nav-with-prelayout";

export const metadata: Metadata = {
  title: "priority-plus — Next.js prelayout demo",
  description:
    "Server-rendered priority-plus nav laid out before first paint via the prelayout pass.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          A parser-blocking inline script only runs once the parser reaches it.
          Streamed HTML can be flushed in chunks, and the browser is free to
          paint a chunk boundary that falls between the nav's markup and the
          script that lays it out — the flash prelayout exists to prevent.
          This holds the first paint back until the sentinel after the script is
          parsed, so the nav's first paint is always the laid-out one. Rendering
          is unblocked at end of parse regardless, so a page without the nav
          can't hang. Chromium and Safari 18.2+; elsewhere it's inert and the
          behaviour is exactly what it is today.
        */}
        <link
          rel="expect"
          href={`#${PRELAYOUT_SENTINEL_ID}`}
          blocking="render"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
