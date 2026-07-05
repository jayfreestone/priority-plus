<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const LABELS = [
  "Dashboard",
  "Projects",
  "Reports",
  "Analytics",
  "Customers",
  "Billing",
  "Integrations",
  "Automations",
  "Team",
  "Audit log",
  "Support",
  "Status",
];

const INITIAL_ITEMS = 8;

const FEATURES = [
  {
    n: "01",
    title: "One core, three adapters",
    body: "All the measurement and fit maths live in @priority-plus/core. The React hook, Svelte 5 component, and custom element are thin shells that wire it to each runtime's lifecycle and renderer.",
  },
  {
    n: "02",
    title: "Measure once, react to resize",
    body: "Item widths are measured once and cached. Resizes reuse them, and ResizeObserver bursts coalesce into a single layout per frame. No thrash, no flicker.",
  },
  {
    n: "03",
    title: "Bring your own markup",
    body: "No bundled CSS and no shadow DOM in your way. Class-name slots and data attributes hand you the DOM; aria-expanded and hidden are managed for you.",
  },
  {
    n: "04",
    title: "Works before JavaScript",
    body: "The custom element enhances server-rendered markup in place. If the script never loads, your nav is still a perfectly usable list of links.",
  },
];

const ADAPTERS = [
  {
    name: "React",
    detail: "usePriorityPlus() hook + <PriorityPlus /> component",
    link: "/adapters/react",
  },
  {
    name: "Svelte",
    detail: "A Svelte 5 component built on runes",
    link: "/adapters/svelte",
  },
  {
    name: "Custom element",
    detail: "<priority-plus> — progressive enhancement",
    link: "/adapters/custom-element",
  },
  {
    name: "Core",
    detail: "Build your own adapter on the layout session",
    link: "/adapters/core",
  },
];

const stageWrap = ref<HTMLElement>();
const stage = ref<HTMLElement>();
const mount = ref<HTMLElement>();

const widthPct = ref(62);
const stagePx = ref(0);
const itemCount = ref(INITIAL_ITEMS);
const visibleCount = ref(INITIAL_ITEMS);
const overflowCount = ref(0);
const playing = ref(false);
const collapse = ref(false);
const interacted = ref(false);
const copied = ref(false);

let nav: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let resizeObserver: ResizeObserver | undefined;
let syncRaf = 0;
let playRaf = 0;
let playPhase = 0;
let playLast = 0;
let copyTimer: ReturnType<typeof setTimeout> | undefined;
let dragCleanup: (() => void) | undefined;

const OVERFLOW_EVENT = "priority-plus:overflow-count-change";

function demoMarkup(): string {
  const items = LABELS.slice(0, INITIAL_ITEMS)
    .map((label) => `<li><a href="#">${label}</a></li>`)
    .join("");

  return `
    <priority-plus>
      <nav class="pp-nav" aria-label="Demo navigation">
        <ul data-priority-plus-primary class="pp-primary">${items}</ul>
        <button hidden type="button" data-priority-plus-toggle class="pp-toggle">
          More <span class="pp-badge"></span>
        </button>
        <ul hidden data-priority-plus-overflow class="pp-overflow"></ul>
      </nav>
    </priority-plus>
  `;
}

function lists() {
  const primary = nav?.querySelector<HTMLElement>(
    "[data-priority-plus-primary]",
  );
  const overflow = nav?.querySelector<HTMLElement>(
    "[data-priority-plus-overflow]",
  );
  return { primary, overflow };
}

function syncState() {
  const el = nav as unknown as {
    itemCount: number;
    visibleCount: number;
    overflowCount: number;
  } | null;
  if (!el) return;

  itemCount.value = el.itemCount;
  visibleCount.value = el.visibleCount;
  overflowCount.value = el.overflowCount;
  if (badge) badge.textContent = String(el.overflowCount);
}

// Waits out the element's MutationObserver → layout round-trip.
function syncSoon() {
  cancelAnimationFrame(syncRaf);
  syncRaf = requestAnimationFrame(() =>
    (syncRaf = requestAnimationFrame(syncState)),
  );
}

function addItem() {
  const { primary, overflow } = lists();
  if (!primary || !overflow) return;

  const count = primary.children.length + overflow.children.length;
  if (count >= LABELS.length) return;

  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = "#";
  a.textContent = LABELS[count];
  li.appendChild(a);
  // Append to the overflow end when it has items so logical order matches
  // LABELS (the element reads items as [...primary, ...overflow]).
  (overflow.children.length > 0 ? overflow : primary).appendChild(li);
  syncSoon();
}

function removeItem() {
  const { primary, overflow } = lists();
  if (!primary || !overflow) return;
  if (primary.children.length + overflow.children.length <= 1) return;

  (overflow.lastElementChild ?? primary.lastElementChild)?.remove();
  syncSoon();
}

function onCollapse() {
  if (!nav) return;
  if (collapse.value) {
    nav.setAttribute("collapse-at-count", "3");
  } else {
    nav.removeAttribute("collapse-at-count");
  }
  syncSoon();
}

function onSlider() {
  interacted.value = true;
  stopPlay();
}

function clampPct(pct: number) {
  return Math.min(100, Math.max(24, pct));
}

function onHandleDown(event: PointerEvent) {
  if (!stage.value || !stageWrap.value) return;
  interacted.value = true;
  stopPlay();

  const wrapWidth = stageWrap.value.getBoundingClientRect().width;
  const startWidth = stage.value.getBoundingClientRect().width;
  const startX = event.clientX;

  const onMove = (move: PointerEvent) => {
    const next = ((startWidth + (move.clientX - startX)) / wrapWidth) * 100;
    widthPct.value = clampPct(next);
  };
  const onUp = () => dragCleanup?.();

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  dragCleanup = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    dragCleanup = undefined;
  };
}

function onHandleKey(event: KeyboardEvent) {
  const delta =
    event.key === "ArrowLeft" ? -4 : event.key === "ArrowRight" ? 4 : 0;
  if (delta === 0) return;
  event.preventDefault();
  interacted.value = true;
  stopPlay();
  widthPct.value = clampPct(widthPct.value + delta);
}

function togglePlay() {
  interacted.value = true;
  if (playing.value) {
    stopPlay();
    return;
  }
  playing.value = true;
  playLast = performance.now();
  playPhase = Math.acos((widthPct.value - 62) / 38);
  playRaf = requestAnimationFrame(playTick);
}

function playTick(now: number) {
  if (!playing.value) return;
  playPhase += (now - playLast) / 1400;
  playLast = now;
  widthPct.value = clampPct(62 + 38 * Math.cos(playPhase));
  playRaf = requestAnimationFrame(playTick);
}

function stopPlay() {
  playing.value = false;
  cancelAnimationFrame(playRaf);
}

async function copyInstall() {
  try {
    await navigator.clipboard.writeText("npm install priority-plus");
    copied.value = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard unavailable — the command is right there to select */
  }
}

function onOverflowChange() {
  syncState();
}

function onMountClick(event: Event) {
  const anchor = (event.target as Element).closest("a");
  if (anchor?.getAttribute("href") === "#") event.preventDefault();
}

onMounted(async () => {
  await import("priority-plus");
  if (!mount.value || !stage.value) return;

  mount.value.innerHTML = demoMarkup();
  mount.value.addEventListener("click", onMountClick);
  nav = mount.value.querySelector("priority-plus");
  badge = mount.value.querySelector(".pp-badge");
  nav?.addEventListener(OVERFLOW_EVENT, onOverflowChange);

  resizeObserver = new ResizeObserver((entries) => {
    stagePx.value = Math.round(entries[0].contentRect.width);
  });
  resizeObserver.observe(stage.value);

  syncSoon();
});

onBeforeUnmount(() => {
  stopPlay();
  cancelAnimationFrame(syncRaf);
  clearTimeout(copyTimer);
  dragCleanup?.();
  resizeObserver?.disconnect();
  nav?.removeEventListener(OVERFLOW_EVENT, onOverflowChange);
  mount.value?.removeEventListener("click", onMountClick);
  nav = null;
  badge = null;
});
</script>

<template>
  <div class="pps">
    <!-- ============================== HERO ============================== -->
    <section class="pps-hero">
      <div class="pps-hero-deco" aria-hidden="true">
        <span class="pps-cross" style="top: 14%; left: 5%">+</span>
        <span class="pps-cross" style="top: 8%; right: 12%">+</span>
        <span class="pps-cross" style="top: 46%; right: 4%">+</span>
        <span class="pps-cross" style="bottom: 18%; left: 10%">+</span>
        <div class="pps-titleblock">
          <span>priority-plus</span>
          <span>sheet 01 — nav, measured</span>
          <span>rev A</span>
        </div>
      </div>

      <div class="pps-container">
        <p class="pps-eyebrow pps-rise" style="--d: 0s">
          Priority+ navigation · zero dependencies · React / Svelte / HTML
        </p>

        <h1 class="pps-h1 pps-rise" style="--d: 0.06s">
          Navigation that<br />
          <span class="pps-redline">
            <span class="pps-redline-label">fit: auto</span>
            measures</span
          >
          itself.
        </h1>

        <p class="pps-lede pps-rise" style="--d: 0.14s">
          priority-plus packs in every item that fits and tucks the rest behind
          a “More” menu — measured once, re-laid-out on resize, never wrapped.
          Below is the real <code>&lt;priority-plus&gt;</code> element.
          Squeeze it.
        </p>

        <div class="pps-ctas pps-rise" style="--d: 0.22s">
          <a class="pps-btn pps-btn-primary" href="/guide/getting-started"
            >Get started</a
          >
          <a class="pps-btn pps-btn-ghost" href="/guide/what-is-priority-plus"
            >What is Priority+?</a
          >
          <a
            class="pps-btn pps-btn-ghost"
            href="https://github.com/jayfreestone/priority-plus"
            target="_blank"
            rel="noreferrer"
            >GitHub ↗</a
          >
        </div>

        <!-- Demo stage -->
        <div class="pps-stagewrap pps-rise" style="--d: 0.32s" ref="stageWrap">
          <div
            class="pps-stage"
            ref="stage"
            :style="{ width: widthPct + '%' }"
          >
            <div class="pps-frame">
              <div class="pps-chrome">
                <span class="pps-dots"><i /><i /><i /></span>
                <span class="pps-url">acme.dev/header.html</span>
                <span class="pps-chips">
                  <span class="pps-chip">items {{ itemCount }}</span>
                  <span class="pps-chip">visible {{ visibleCount }}</span>
                  <span
                    class="pps-chip pps-chip-red"
                    :class="{ 'is-live': overflowCount > 0 }"
                    >overflow {{ overflowCount }}</span
                  >
                </span>
              </div>
              <div class="pps-mount" ref="mount"></div>
            </div>

            <button
              class="pps-handle"
              type="button"
              aria-label="Resize the demo container (arrow keys work too)"
              @pointerdown="onHandleDown"
              @keydown="onHandleKey"
            >
              <span /><span />
            </button>
            <span v-if="!interacted" class="pps-hint">◂ drag ▸</span>

            <div class="pps-dim">
              <span class="pps-dim-label">{{ stagePx }}px</span>
            </div>
          </div>
          <div class="pps-ruler" aria-hidden="true"></div>
        </div>

        <!-- Controls -->
        <div class="pps-deck pps-rise" style="--d: 0.4s">
          <div class="pps-ctrl pps-ctrl-width">
            <label class="pps-ctrl-label" for="pps-width"
              >container width</label
            >
            <div class="pps-ctrl-row">
              <input
                id="pps-width"
                type="range"
                min="24"
                max="100"
                step="0.1"
                v-model.number="widthPct"
                @input="onSlider"
              />
              <button class="pps-play" type="button" @click="togglePlay">
                {{ playing ? "■ stop" : "▶ auto" }}
              </button>
            </div>
          </div>

          <div class="pps-ctrl">
            <span class="pps-ctrl-label">items</span>
            <div class="pps-ctrl-row">
              <button
                class="pps-step"
                type="button"
                :disabled="itemCount <= 1"
                aria-label="Remove an item"
                @click="removeItem"
              >
                −
              </button>
              <span class="pps-countread"
                >{{ itemCount }}<em>/{{ LABELS.length }}</em></span
              >
              <button
                class="pps-step"
                type="button"
                :disabled="itemCount >= LABELS.length"
                aria-label="Add an item"
                @click="addItem"
              >
                +
              </button>
            </div>
          </div>

          <div class="pps-ctrl">
            <span class="pps-ctrl-label">options</span>
            <label class="pps-check">
              <input type="checkbox" v-model="collapse" @change="onCollapse" />
              <code>collapse-at-count="3"</code>
            </label>
          </div>
        </div>
      </div>
    </section>

    <!-- ============================== SPECS ============================== -->
    <section class="pps-section">
      <div class="pps-container">
        <p class="pps-fig">fig. 01 — the system</p>
        <h2 class="pps-h2">
          One core. Small, idiomatic adapters.<br />
          Zero opinions about your CSS.
        </h2>
        <div class="pps-cards">
          <article v-for="f in FEATURES" :key="f.n" class="pps-card">
            <span class="pps-card-n">{{ f.n }}</span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.body }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ============================== CODE ============================== -->
    <section class="pps-section pps-section-alt">
      <div class="pps-container pps-split">
        <div class="pps-split-copy">
          <p class="pps-fig">fig. 02 — progressive enhancement</p>
          <h2 class="pps-h2">Server-render links.<br />Enhance in place.</h2>
          <p class="pps-body">
            Write ordinary navigation markup and mark three elements with data
            attributes. The custom element measures your real DOM in place and
            moves overflowing items into the menu — no re-render, no bundled
            styles, no layout shift.
          </p>
          <p class="pps-body">
            If JavaScript never arrives, nothing breaks: the toggle and
            overflow list stay <code>hidden</code> and users see a complete
            list of links.
          </p>
          <button class="pps-install" type="button" @click="copyInstall">
            <span class="pps-install-prompt">$</span>
            npm install priority-plus
            <span class="pps-install-copy">{{
              copied ? "copied ✓" : "copy"
            }}</span>
          </button>
          <a class="pps-textlink" href="/adapters/custom-element"
            >Custom element docs →</a
          >
        </div>

        <div class="pps-codeblock" aria-label="Example markup">
          <div class="pps-codebar">
            <span>header.html</span>
            <span class="pps-codebar-badge">no build step</span>
          </div>
          <pre><code><span class="cl"><i class="t">&lt;priority-plus&gt;</i></span>
<span class="cl">  <i class="t">&lt;nav&gt;</i></span>
<span class="cl">    <i class="t">&lt;ul</i> <i class="a">data-priority-plus-primary</i><i class="t">&gt;</i></span>
<span class="cl">      <i class="t">&lt;li&gt;&lt;a</i> <i class="a">href</i>=<i class="s">"/home"</i><i class="t">&gt;</i>Home<i class="t">&lt;/a&gt;&lt;/li&gt;</i></span>
<span class="cl">      <i class="t">&lt;li&gt;&lt;a</i> <i class="a">href</i>=<i class="s">"/products"</i><i class="t">&gt;</i>Products<i class="t">&lt;/a&gt;&lt;/li&gt;</i></span>
<span class="cl">      <i class="t">&lt;li&gt;&lt;a</i> <i class="a">href</i>=<i class="s">"/pricing"</i><i class="t">&gt;</i>Pricing<i class="t">&lt;/a&gt;&lt;/li&gt;</i></span>
<span class="cl">    <i class="t">&lt;/ul&gt;</i></span>
<span class="cl">    <i class="t">&lt;button</i> <i class="a">hidden data-priority-plus-toggle</i><i class="t">&gt;</i>More<i class="t">&lt;/button&gt;</i></span>
<span class="cl">    <i class="t">&lt;ul</i> <i class="a">hidden data-priority-plus-overflow</i><i class="t">&gt;&lt;/ul&gt;</i></span>
<span class="cl">  <i class="t">&lt;/nav&gt;</i></span>
<span class="cl"><i class="t">&lt;/priority-plus&gt;</i></span>
<span class="cl"></span>
<span class="cl"><i class="t">&lt;script</i> <i class="a">type</i>=<i class="s">"module"</i><i class="t">&gt;</i></span>
<span class="cl">  <i class="k">import</i> <i class="s">"priority-plus"</i>;</span>
<span class="cl"><i class="t">&lt;/script&gt;</i></span></code></pre>
        </div>
      </div>
    </section>

    <!-- ============================== ADAPTERS ============================== -->
    <section class="pps-section">
      <div class="pps-container">
        <p class="pps-fig">fig. 03 — pick your runtime</p>
        <h2 class="pps-h2">Same maths, your framework.</h2>
        <div class="pps-adapters">
          <a
            v-for="a in ADAPTERS"
            :key="a.name"
            class="pps-adapter"
            :href="a.link"
          >
            <span class="pps-adapter-name">{{ a.name }} <em>→</em></span>
            <span class="pps-adapter-detail">{{ a.detail }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- ============================== CTA ============================== -->
    <section class="pps-cta">
      <div class="pps-hero-deco" aria-hidden="true">
        <span class="pps-cross" style="top: 24%; left: 8%">+</span>
        <span class="pps-cross" style="bottom: 20%; right: 7%">+</span>
      </div>
      <div class="pps-container">
        <h2 class="pps-cta-h">Make room.</h2>
        <p class="pps-cta-p">
          Install the adapter for your stack and ship a nav that always fits.
        </p>
        <div class="pps-ctas">
          <a class="pps-btn pps-btn-primary" href="/guide/getting-started"
            >Read the docs</a
          >
          <a
            class="pps-btn pps-btn-ghost"
            href="https://github.com/jayfreestone/priority-plus"
            target="_blank"
            rel="noreferrer"
            >Star on GitHub ↗</a
          >
        </div>
      </div>
    </section>
  </div>
</template>

<style>
/* ————————————————————————————————————————————————————————————————
   priority-plus splash · “redline” drafting aesthetic
   Everything is namespaced under .pps; demo markup (injected, unscoped)
   uses .pp-* classes styled from here.
   ———————————————————————————————————————————————————————————————— */

.pps {
  --pps-ink: #0a1322;
  --pps-ink-2: #0e1a30;
  --pps-panel: #101c33;
  --pps-line: rgba(148, 180, 255, 0.09);
  --pps-line-2: rgba(148, 180, 255, 0.24);
  --pps-blue: #7fb0ff;
  --pps-text: #eef3ff;
  --pps-text-dim: #93a5c9;
  --pps-red: #ff5c29;
  --pps-red-soft: rgba(255, 92, 41, 0.14);
  --pps-sans: "Archivo", ui-sans-serif, system-ui, sans-serif;
  --pps-mono: "JetBrains Mono", ui-monospace, monospace;
  font-family: var(--pps-sans);
}

.pps ::selection {
  background: var(--pps-red);
  color: var(--pps-ink);
}

.pps a {
  text-decoration: none;
}

.pps :focus-visible {
  outline: 2px solid var(--pps-red);
  outline-offset: 2px;
}

.pps-container {
  position: relative;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Entrance */
.pps-rise {
  animation: pps-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: var(--d, 0s);
}

@keyframes pps-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ————— Hero ————— */

.pps-hero {
  position: relative;
  overflow: clip;
  padding: clamp(3.5rem, 9vh, 6.5rem) 0 clamp(4rem, 9vh, 6.5rem);
  color: var(--pps-text);
  background:
    radial-gradient(
      900px 420px at 70% -10%,
      rgba(127, 176, 255, 0.14),
      transparent 65%
    ),
    linear-gradient(var(--pps-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--pps-line) 1px, transparent 1px),
    var(--pps-ink);
  background-size:
    auto,
    36px 36px,
    36px 36px,
    auto;
}

.pps-hero-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.pps-cross {
  position: absolute;
  font: 400 18px var(--pps-mono);
  color: rgba(127, 176, 255, 0.35);
}

.pps-titleblock {
  position: absolute;
  right: 24px;
  bottom: 20px;
  display: flex;
  border: 1px solid var(--pps-line-2);
  font: 500 10px/1 var(--pps-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pps-text-dim);
}

.pps-titleblock span {
  padding: 7px 12px;
}

.pps-titleblock span + span {
  border-left: 1px solid var(--pps-line-2);
}

.pps-titleblock span:last-child {
  color: var(--pps-red);
}

@media (max-width: 960px) {
  .pps-titleblock {
    display: none;
  }
}

.pps-eyebrow {
  margin: 0 0 1.4rem;
  font: 500 12px var(--pps-mono);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--pps-blue);
}

.pps-h1 {
  margin: 0;
  font-size: clamp(2.6rem, 6.5vw, 5rem);
  font-weight: 900;
  line-height: 0.99;
  letter-spacing: -0.025em;
}

.pps-redline {
  position: relative;
  display: inline-block;
  color: var(--pps-red);
}

/* dimension bracket under the measured word */
.pps-redline::before {
  content: "";
  position: absolute;
  left: 0.02em;
  right: 0.02em;
  bottom: -0.16em;
  height: 0.13em;
  border-bottom: 2px solid var(--pps-red);
  border-left: 2px solid var(--pps-red);
  border-right: 2px solid var(--pps-red);
  opacity: 0.85;
}

.pps-redline-label {
  position: absolute;
  top: calc(100% + 0.3em);
  left: 50%;
  transform: translateX(-50%);
  padding: 0 0.5em;
  background: var(--pps-ink);
  font: 500 max(0.155em, 9px) var(--pps-mono);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--pps-red);
}

.pps-lede {
  max-width: 620px;
  margin: 2.4rem 0 0;
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--pps-text-dim);
}

.pps-lede code {
  font: 500 0.9em var(--pps-mono);
  color: var(--pps-blue);
}

.pps-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 2rem;
}

.pps-btn {
  display: inline-flex;
  align-items: center;
  padding: 11px 22px;
  border: 1px solid transparent;
  border-radius: 4px;
  font: 700 13px var(--pps-mono);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.pps-btn:active {
  transform: translateY(1px);
}

.pps-btn-primary {
  background: var(--pps-red);
  color: var(--pps-ink);
}

.pps-btn-primary:hover {
  background: #ff7448;
}

.pps-btn-ghost {
  border-color: var(--pps-line-2);
  color: var(--pps-text);
}

.pps-btn-ghost:hover {
  border-color: var(--pps-blue);
}

/* ————— Demo stage ————— */

.pps-stagewrap {
  margin-top: clamp(2.6rem, 6vh, 4rem);
}

.pps-stage {
  position: relative;
  z-index: 2;
  min-width: min(272px, 100%);
}

.pps-frame {
  position: relative;
  background: linear-gradient(180deg, #101b31, #0c1526);
  border: 1px solid var(--pps-line-2);
  border-radius: 10px;
  box-shadow: 0 32px 64px -32px rgba(0, 0, 0, 0.65);
}

/* red corner ticks, like a registration mark */
.pps-frame::before,
.pps-frame::after {
  content: "";
  position: absolute;
  width: 12px;
  height: 12px;
  border: 0 solid var(--pps-red);
  pointer-events: none;
}

.pps-frame::before {
  top: -5px;
  left: -5px;
  border-top-width: 2px;
  border-left-width: 2px;
}

.pps-frame::after {
  bottom: -5px;
  right: -5px;
  border-bottom-width: 2px;
  border-right-width: 2px;
}

.pps-chrome {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--pps-line);
}

.pps-dots {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.pps-dots i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(148, 180, 255, 0.22);
}

.pps-url {
  overflow: hidden;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(127, 176, 255, 0.08);
  font: 400 11px var(--pps-mono);
  color: var(--pps-text-dim);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pps-chips {
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-shrink: 0;
}

.pps-chip {
  padding: 3px 8px;
  border: 1px solid var(--pps-line-2);
  border-radius: 3px;
  font: 500 10px var(--pps-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pps-text-dim);
  font-variant-numeric: tabular-nums;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.pps-chip-red.is-live {
  border-color: var(--pps-red);
  background: var(--pps-red-soft);
  color: var(--pps-red);
}

@media (max-width: 560px) {
  .pps-url {
    display: none;
  }
}

.pps-mount {
  min-height: 62px;
}

/* Resize handle */
.pps-handle {
  position: absolute;
  top: calc(50% - 12px);
  right: -13px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 26px;
  height: 58px;
  padding: 0;
  background: var(--pps-ink-2);
  border: 1px solid var(--pps-line-2);
  border-radius: 6px;
  cursor: ew-resize;
  touch-action: none;
  transition: border-color 0.15s ease;
}

.pps-handle:hover {
  border-color: var(--pps-red);
}

.pps-handle span {
  width: 2px;
  height: 22px;
  background: var(--pps-text-dim);
  border-radius: 1px;
}

.pps-handle:hover span {
  background: var(--pps-red);
}

.pps-hint {
  position: absolute;
  top: -26px;
  right: -8px;
  font: 700 10px var(--pps-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pps-red);
  white-space: nowrap;
  animation: pps-nudge 1.4s ease-in-out infinite;
}

@keyframes pps-nudge {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-5px);
  }
}

/* Dimension line under the stage */
.pps-dim {
  position: relative;
  height: 22px;
  margin-top: 14px;
}

.pps-dim::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 5px;
  height: 11px;
  border-left: 1px solid var(--pps-red);
  border-right: 1px solid var(--pps-red);
}

.pps-dim::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 10px;
  border-top: 1px solid var(--pps-red);
}

.pps-dim-label {
  position: absolute;
  left: 50%;
  top: 2px;
  transform: translateX(-50%);
  z-index: 1;
  padding: 0 10px;
  background: var(--pps-ink);
  font: 500 11px/1.5 var(--pps-mono);
  color: var(--pps-red);
  font-variant-numeric: tabular-nums;
}

/* Full-width ruler beneath */
.pps-ruler {
  height: 14px;
  margin-top: 10px;
  border-bottom: 1px solid var(--pps-line-2);
  background:
    repeating-linear-gradient(
        90deg,
        var(--pps-line-2) 0 1px,
        transparent 1px 12px
      )
      bottom / 100% 6px no-repeat,
    repeating-linear-gradient(
        90deg,
        var(--pps-line-2) 0 1px,
        transparent 1px 60px
      )
      bottom / 100% 13px no-repeat;
}

/* ————— Control deck ————— */

.pps-deck {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 28px 44px;
  margin-top: 2.2rem;
}

.pps-ctrl-label {
  display: block;
  margin-bottom: 10px;
  font: 500 10px var(--pps-mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--pps-text-dim);
}

.pps-ctrl-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pps-ctrl-width {
  flex: 1 1 260px;
  max-width: 420px;
}

.pps input[type="range"] {
  flex: 1;
  height: 28px;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  cursor: pointer;
}

.pps input[type="range"]::-webkit-slider-runnable-track {
  height: 2px;
  background: rgba(127, 176, 255, 0.35);
}

.pps input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  margin-top: -6.5px;
  background: var(--pps-red);
  border: 2px solid var(--pps-ink);
  border-radius: 2px;
  box-shadow: 0 0 0 1px var(--pps-red);
}

.pps input[type="range"]::-moz-range-track {
  height: 2px;
  background: rgba(127, 176, 255, 0.35);
}

.pps input[type="range"]::-moz-range-thumb {
  width: 11px;
  height: 11px;
  background: var(--pps-red);
  border: 2px solid var(--pps-ink);
  border-radius: 2px;
  box-shadow: 0 0 0 1px var(--pps-red);
}

.pps-play {
  padding: 7px 14px;
  background: transparent;
  border: 1px solid var(--pps-line-2);
  border-radius: 4px;
  font: 700 11px var(--pps-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pps-text);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.pps-play:hover {
  border-color: var(--pps-red);
  color: var(--pps-red);
}

.pps-step {
  width: 34px;
  height: 34px;
  background: transparent;
  border: 1px solid var(--pps-line-2);
  border-radius: 4px;
  font: 500 17px/1 var(--pps-mono);
  color: var(--pps-text);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;
}

.pps-step:hover:not(:disabled) {
  border-color: var(--pps-red);
  color: var(--pps-red);
}

.pps-step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pps-countread {
  min-width: 46px;
  text-align: center;
  font: 700 14px var(--pps-mono);
  color: var(--pps-text);
  font-variant-numeric: tabular-nums;
}

.pps-countread em {
  font-style: normal;
  font-weight: 400;
  color: var(--pps-text-dim);
}

.pps-check {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 34px;
  font: 500 12px var(--pps-mono);
  color: var(--pps-text);
  cursor: pointer;
}

.pps-check input {
  width: 15px;
  height: 15px;
  accent-color: var(--pps-red);
  cursor: pointer;
}

.pps-check code {
  color: var(--pps-blue);
}

/* ————— Injected demo nav (.pp-*) ————— */

.pps .pp-nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px 13px 14px;
  overflow-x: clip;
  overflow-y: visible;
}

.pps .pp-primary {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
}

.pps .pp-primary a {
  display: block;
  padding: 7px 13px;
  border-radius: 999px;
  font: 600 13px var(--pps-sans);
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: #cbdcff;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.pps .pp-primary a:hover {
  background: rgba(127, 176, 255, 0.12);
  color: #fff;
}

.pps .pp-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-shrink: 0;
  margin-left: auto;
  min-width: 100px;
  padding: 8px 14px;
  background: var(--pps-red-soft);
  border: 1px solid rgba(255, 92, 41, 0.55);
  border-radius: 999px;
  font: 700 11px var(--pps-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffcdb8;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.pps .pp-toggle[hidden] {
  display: none;
}

.pps .pp-toggle:hover {
  background: rgba(255, 92, 41, 0.24);
}

.pps .pp-toggle[aria-expanded="true"] {
  background: var(--pps-red);
  color: var(--pps-ink);
}

.pps .pp-badge {
  min-width: 2ch;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 92, 41, 0.28);
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.pps .pp-toggle[aria-expanded="true"] .pp-badge {
  background: rgba(10, 19, 34, 0.22);
}

.pps .pp-overflow {
  position: absolute;
  z-index: 40;
  top: calc(100% - 2px);
  right: 10px;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--pps-panel);
  border: 1px solid var(--pps-line-2);
  border-radius: 10px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.6);
  transform-origin: top right;
}

.pps .pp-overflow[hidden] {
  display: none;
}

.pps .pp-overflow:not([hidden]) {
  animation: pps-pop 0.16s cubic-bezier(0.2, 0.7, 0.2, 1.2);
}

@keyframes pps-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.pps .pp-overflow a {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font: 600 13px var(--pps-sans);
  color: #d7e4ff;
  transition: background 0.12s ease;
}

.pps .pp-overflow a:hover {
  background: rgba(127, 176, 255, 0.12);
}

/* ————— Lower sections (theme-aware) ————— */

.pps-section {
  padding: clamp(3.5rem, 9vh, 6rem) 0;
  background: var(--vp-c-bg);
}

.pps-section-alt {
  background: var(--vp-c-bg-soft);
}

.pps-fig {
  margin: 0 0 1rem;
  font: 500 11px var(--pps-mono);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pps-red);
}

.pps-h2 {
  margin: 0 0 2.4rem;
  font-size: clamp(1.6rem, 3.4vw, 2.4rem);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.pps-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1px;
  background: var(--vp-c-divider);
  border: 1px solid var(--vp-c-divider);
}

.pps-card {
  position: relative;
  padding: 26px 24px 28px;
  background: var(--vp-c-bg);
  transition: background 0.2s ease;
}

.pps-card:hover {
  background: var(--vp-c-bg-soft);
}

.pps-card-n {
  display: block;
  margin-bottom: 1.6rem;
  font: 700 12px var(--pps-mono);
  color: var(--pps-red);
}

.pps-card h3 {
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.pps-card p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

/* Code split */
.pps-split {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(2rem, 5vw, 4.5rem);
  align-items: start;
}

@media (max-width: 860px) {
  .pps-split {
    grid-template-columns: 1fr;
  }
}

.pps-body {
  margin: 0 0 1rem;
  max-width: 460px;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.pps-body code {
  font: 500 0.85em var(--pps-mono);
  color: var(--vp-c-text-1);
}

.pps-install {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 460px;
  margin: 1.6rem 0 1rem;
  padding: 13px 16px;
  background: var(--pps-ink);
  border: 1px solid var(--pps-line-2);
  border-radius: 6px;
  font: 500 13px var(--pps-mono);
  color: var(--pps-text);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease;
}

.pps-install:hover {
  border-color: var(--pps-red);
}

.pps-install-prompt {
  color: var(--pps-red);
}

.pps-install-copy {
  margin-left: auto;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pps-text-dim);
}

.pps-install:hover .pps-install-copy {
  color: var(--pps-red);
}

.pps-textlink {
  font: 700 12px var(--pps-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pps-red);
}

.pps-textlink:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* Code block */
.pps-codeblock {
  overflow: hidden;
  background: var(--pps-ink);
  border: 1px solid var(--pps-line-2);
  border-radius: 10px;
  box-shadow: 0 24px 48px -24px rgba(0, 0, 0, 0.45);
}

.pps-codebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--pps-line);
  font: 500 11px var(--pps-mono);
  color: var(--pps-text-dim);
}

.pps-codebar-badge {
  padding: 2px 8px;
  border: 1px solid rgba(255, 92, 41, 0.5);
  border-radius: 3px;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pps-red);
}

.pps-codeblock pre {
  margin: 0;
  padding: 18px 0;
  overflow-x: auto;
}

.pps-codeblock code {
  display: block;
  font: 400 12.5px/1.75 var(--pps-mono);
  color: #dbe6ff;
  counter-reset: pps-line;
}

.pps-codeblock .cl {
  display: block;
  padding: 0 18px 0 0;
}

.pps-codeblock .cl::before {
  counter-increment: pps-line;
  content: counter(pps-line, decimal-leading-zero);
  display: inline-block;
  width: 3.4em;
  padding-right: 1.4em;
  text-align: right;
  color: rgba(147, 165, 201, 0.4);
  user-select: none;
}

.pps-codeblock i {
  font-style: normal;
}

.pps-codeblock .t {
  color: var(--pps-blue);
}

.pps-codeblock .a {
  color: var(--pps-red);
}

.pps-codeblock .s {
  color: #9fe8c5;
}

.pps-codeblock .k {
  color: #d5a6ff;
}

/* Adapters */
.pps-adapters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.pps-adapter {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.pps-adapter:hover {
  border-color: var(--pps-red);
  transform: translateY(-2px);
}

.pps-adapter-name {
  display: flex;
  justify-content: space-between;
  font: 700 15px var(--pps-sans);
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.pps-adapter-name em {
  font-style: normal;
  color: var(--pps-red);
  transition: transform 0.15s ease;
}

.pps-adapter:hover .pps-adapter-name em {
  transform: translateX(3px);
}

.pps-adapter-detail {
  font: 400 12px var(--pps-mono);
  color: var(--vp-c-text-2);
}

/* CTA band */
.pps-cta {
  position: relative;
  overflow: clip;
  padding: clamp(4rem, 10vh, 6.5rem) 0;
  text-align: center;
  color: var(--pps-text);
  background:
    radial-gradient(
      700px 320px at 50% 120%,
      rgba(255, 92, 41, 0.16),
      transparent 65%
    ),
    linear-gradient(var(--pps-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--pps-line) 1px, transparent 1px),
    var(--pps-ink);
  background-size:
    auto,
    36px 36px,
    36px 36px,
    auto;
}

.pps-cta-h {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 4.2rem);
  font-weight: 900;
  letter-spacing: -0.025em;
}

.pps-cta-p {
  margin: 1rem 0 0;
  color: var(--pps-text-dim);
}

.pps-cta .pps-ctas {
  justify-content: center;
  margin-top: 2.2rem;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pps-rise,
  .pps-hint,
  .pps .pp-overflow:not([hidden]) {
    animation: none;
  }
}
</style>
