import { jsxs, jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { useState, useMemo, useRef, useCallback, useLayoutEffect, useEffect } from "react";
function c({ primaryNonContentInlineSize: e, ...t }, n) {
  return { ...t, available: n - e };
}
function l({ itemWidths: e, itemGap: t, containerGap: n, toggleWidth: r, available: i }) {
  let a = e.length, o = 0, s = a;
  for (let c2 = 0; c2 < a; c2 += 1) o += (c2 === 0 ? 0 : t) + (e[c2] ?? 0), s === a && o + n + r > i && (s = c2);
  return o <= i ? a : s;
}
function u(e, t, n) {
  return n !== void 0 && e <= n && e < t ? 0 : e;
}
function d(e = 0) {
  return { itemCount: e, visibleCount: e, overflowCount: 0, allVisible: true, measured: false };
}
function f(e, t = {}) {
  let n = e.itemWidths.length, r = u(l(e), n, t.collapseAtCount), i = n - r;
  return { itemCount: n, visibleCount: r, overflowCount: i, allVisible: i === 0, measured: true };
}
function p(e, t) {
  return { visibleItems: e.slice(0, t), overflowItems: e.slice(t) };
}
var m = class {
  #e = 0;
  #t;
  #n;
  #r;
  constructor(e = {}, t = 0) {
    this.#n = e, this.#r = d(t);
  }
  get hasMeasurements() {
    return this.#t !== void 0;
  }
  getState() {
    return this.#r;
  }
  reset(e = this.#r.itemCount) {
    return this.#t = void 0, this.#a(d(e), true);
  }
  setOptions(e) {
    return this.#n = e, this.#i();
  }
  setMeasurements(e, t) {
    return this.#t = e, this.#e = t, this.#i(true);
  }
  setContainerInlineSize(e) {
    return this.#e = e, this.#i();
  }
  #i(e = false) {
    return this.#t === void 0 ? this.#a(this.#r, e) : this.#a(f(c(this.#t, this.#e), this.#n), e);
  }
  #a(e, t = false) {
    let n = this.#r;
    return this.#r = e, { previousState: n, state: e, visibleCountChanged: n.visibleCount !== e.visibleCount, overflowCountChanged: n.overflowCount !== e.overflowCount, itemCountChanged: n.itemCount !== e.itemCount, measurementsChanged: t };
  }
};
function h({ options: e = {}, itemCount: t = 0, readMeasurements: n, getContainerInlineSize: r, onResult: i, requestFrame: a = (e2) => requestAnimationFrame(e2), cancelFrame: o = (e2) => cancelAnimationFrame(e2) }) {
  let s = new m(e, t), c2 = (e2) => {
    if (e2 || !s.hasMeasurements) {
      let e3 = n();
      if (e3 == null) return;
      let t3 = r();
      if (t3 == null) return;
      i(s.setMeasurements(e3, t3));
      return;
    }
    let t2 = r();
    t2 != null && i(s.setContainerInlineSize(t2));
  }, l2 = (e2 = {}) => {
    c2(e2.refreshMeasurements);
  }, u2, d2 = false, f2 = (e2 = {}) => {
    d2 ||= e2.refreshMeasurements, u2 === void 0 && (u2 = a(() => {
      u2 = void 0;
      let e3 = d2;
      d2 = false, c2(e3);
    }));
  }, p2, h2 = /* @__PURE__ */ new Set();
  return { getState: () => s.getState(), layout: l2, schedule: f2, observe: (e2, { refreshOnResize: t2 = false } = {}) => {
    p2 ??= new ResizeObserver((e3) => {
      f2({ refreshMeasurements: e3.some((e4) => h2.has(e4.target)) });
    }), t2 && h2.add(e2), p2.observe(e2);
  }, unobserve: (e2) => {
    h2.delete(e2), p2?.unobserve(e2);
  }, reset: (e2) => i(s.reset(e2)), setOptions: (e2) => i(s.setOptions(e2)), destroy: () => {
    u2 !== void 0 && o(u2), u2 = void 0, d2 = false, p2?.disconnect(), p2 = void 0, h2.clear();
  } };
}
function g(e, t) {
  let n = e && !t.allVisible;
  return { expanded: n, toggleHidden: t.allVisible, overflowHidden: !n };
}
function _(e) {
  return `More (${Math.max(1, e.overflowCount)})`;
}
function v(e) {
  return { itemCount: e, visibleCount: 0, overflowCount: Math.max(1, e), allVisible: false, measured: true };
}
const y = (e) => {
  let t = Number.parseFloat(e);
  return Number.isFinite(t) ? t : 0;
}, b = (e) => {
  let t = getComputedStyle(e);
  return y(t.columnGap || t.gap);
}, x = (e) => {
  let t = getComputedStyle(e);
  return e.getBoundingClientRect().width - y(t.borderLeftWidth) - y(t.borderRightWidth) - y(t.paddingLeft) - y(t.paddingRight);
}, S = (e) => {
  let t = getComputedStyle(e);
  return y(t.marginLeft) + y(t.borderLeftWidth) + y(t.paddingLeft) + y(t.paddingRight) + y(t.borderRightWidth) + y(t.marginRight);
}, C = ({ items: e, itemGapSource: t, container: n, toggle: r, primary: i }) => ({ itemWidths: Array.from(e, (e2) => e2.getBoundingClientRect().width), itemGap: b(t), containerGap: b(n), toggleWidth: r.getBoundingClientRect().width, primaryNonContentInlineSize: S(i) });
function w(o, s = {}) {
  let { collapseAtCount: c2 } = s, l2 = useMemo(() => ({ collapseAtCount: c2 }), [c2]), u2 = useRef(null), f2 = useRef(null), m2 = useRef(null), g2 = useRef(null), [_2, v2] = useState(() => d(o.length)), y2 = useCallback((e) => {
    v2((t) => T(t, e.state) ? t : e.state);
  }, []), b2 = useCallback(() => {
    let e = u2.current, t = f2.current, n = m2.current, r = g2.current;
    return e === null || t === null || n === null || r === null ? null : C({ items: n.children, itemGapSource: n, container: e, toggle: r, primary: t });
  }, []), S2 = useRef(null);
  S2.current === null && (S2.current = h({ itemCount: o.length, options: l2, readMeasurements: b2, getContainerInlineSize: () => {
    let e = u2.current;
    return e === null ? null : x(e);
  }, onResult: y2 }));
  let w2 = useCallback(() => S2.current, []), D2 = useCallback(() => {
    S2.current?.layout({ refreshMeasurements: true });
  }, []), O2 = E(w2, { store: u2, observe: true }), k2 = E(w2, { store: f2 }), A2 = E(w2, { store: m2, observe: true, refreshOnResize: true }), j2 = E(w2, { observe: true, refreshOnResize: true }), M2 = E(w2, { store: g2, observe: true, refreshOnResize: true });
  useLayoutEffect(() => {
    S2.current?.reset(o.length);
  }, [o.length]), useLayoutEffect(() => {
    S2.current?.setOptions(l2);
  }, [l2]), useLayoutEffect(() => {
    D2();
  }, [o, D2]), useEffect(() => () => {
    S2.current?.destroy();
  }, []);
  let { visibleItems: N, overflowItems: P } = useMemo(() => p(o, _2.visibleCount), [o, _2.visibleCount]);
  return { ..._2, containerRef: O2, primaryRef: k2, measureListRef: A2, measureItemRef: j2, measureToggleRef: M2, visibleItems: N, overflowItems: P, update: D2 };
}
function T(e, t) {
  return e.allVisible === t.allVisible && e.itemCount === t.itemCount && e.measured === t.measured && e.overflowCount === t.overflowCount && e.visibleCount === t.visibleCount;
}
function E(t, { store: n, observe: r, refreshOnResize: i } = {}) {
  return useCallback((e) => {
    if (e === null) return;
    n && (n.current = e);
    let a = r ? t() : null;
    return a?.observe(e, { refreshOnResize: i }), () => {
      a?.unobserve(e), n?.current === e && (n.current = null);
    };
  }, [t, n, r, i]);
}
const D = { contain: `layout`, height: 0, left: 0, overflow: `hidden`, pointerEvents: `none`, position: `absolute`, top: 0, visibility: `hidden`, width: `max-content` }, O = (e) => _(e), k = (e, t) => t;
function A({ items: e, children: t, collapseAtCount: n, "aria-label": r = `Priority navigation`, ref: i, renderToggle: c2 = O, getItemKey: l2 = k, className: u2, primaryClassName: d2, overflowClassName: f2, itemClassName: p2, toggleClassName: m2, measurerClassName: h2, ..._2 }) {
  let y2 = w(e, { collapseAtCount: n }), b2 = j(y2.containerRef, i), [x2, S2] = useState(false);
  y2.allVisible && x2 && S2(false);
  let C2 = g(x2, y2), T2 = { allVisible: y2.allVisible, itemCount: y2.itemCount, measured: y2.measured, overflowCount: y2.overflowCount, visibleCount: y2.visibleCount, open: x2 }, E2 = { ...v(y2.itemCount), open: false }, A2 = (e2, n2, r2) => jsx(`li`, { className: p2, children: t(e2, { index: n2, overflowed: r2 }) }, l2(e2, n2));
  return jsxs(`nav`, { ..._2, "aria-label": r, className: u2, "data-priority-plus-collapse-at": n, "data-priority-plus-enhanced": y2.measured ? `` : void 0, ref: b2, children: [jsx(`ul`, { className: d2, "data-priority-plus-primary": ``, ref: y2.primaryRef, children: y2.visibleItems.map((e2, t2) => A2(e2, t2, false)) }), jsx(`button`, { type: `button`, className: m2, "data-priority-plus-toggle": ``, "aria-expanded": C2.expanded, hidden: C2.toggleHidden, onClick: () => S2((e2) => !e2), children: c2(T2) }), !C2.overflowHidden && jsx(`ul`, { className: f2, children: y2.overflowItems.map((e2, t2) => A2(e2, y2.visibleCount + t2, true)) }), jsxs(`div`, { "aria-hidden": `true`, className: h2, "data-priority-plus-measurer": ``, style: D, children: [jsx(`ul`, { className: d2, "data-priority-plus-primary": ``, ref: y2.measureListRef, children: e.map((e2, n2) => jsx(`li`, { className: p2, ref: y2.measureItemRef, children: t(e2, { index: n2, overflowed: false }) }, l2(e2, n2))) }), jsx(`button`, { type: `button`, className: m2, "data-priority-plus-toggle": ``, ref: y2.measureToggleRef, children: c2(E2) })] })] });
}
function j(t, n) {
  return useCallback((e) => {
    if (e === null) return;
    let r = [t, n].map((t2) => M(t2, e));
    return () => {
      for (let e2 of r) e2();
    };
  }, [t, n]);
}
function M(e, t) {
  if (e == null) return () => {
  };
  if (typeof e == `function`) {
    let n = e(t);
    return typeof n == `function` ? n : () => e(null);
  }
  return e.current = t, () => {
    e.current = null;
  };
}
const items = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#projects", label: "Projects" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#integrations", label: "Integrations" },
  { href: "#analytics", label: "Analytics" },
  { href: "#reports", label: "Reports" },
  { href: "#members", label: "Members" },
  { href: "#billing", label: "Billing" },
  { href: "#settings", label: "Settings" },
  { href: "#support", label: "Support" }
];
function App() {
  return /* @__PURE__ */ jsx(
    A,
    {
      "aria-label": "Demo",
      className: "nav",
      primaryClassName: "list",
      overflowClassName: "overflow",
      itemClassName: "item",
      toggleClassName: "toggle",
      items,
      getItemKey: (item) => item.href,
      renderToggle: () => "More ▾",
      children: (item) => /* @__PURE__ */ jsx("a", { className: "link", href: item.href, children: item.label })
    }
  );
}
function render() {
  return renderToString(/* @__PURE__ */ jsx(App, {}));
}
export {
  render
};
