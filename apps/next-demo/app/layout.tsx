import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "priority-plus — Next.js prelayout demo",
  description:
    "Server-rendered priority-plus nav laid out before first paint via the prelayout pass.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
