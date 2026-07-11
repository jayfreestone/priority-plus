import { NavWithPrelayout } from "./nav-with-prelayout";

export default function Page() {
  return (
    <main>
      <h1>Next.js + prelayout</h1>
      <p>
        This page is server-rendered by the App Router. The nav below is a
        client component; the inline script directly after it is emitted by a
        server component and lays the nav out <em>before first paint</em>,
        long before hydration.
      </p>
      <NavWithPrelayout />
      <p>
        Throttle the network in devtools to widen the gap between paint and
        hydration — the nav is correctly collapsed the whole time.
      </p>
    </main>
  );
}
