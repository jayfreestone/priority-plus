import eventTarget from './events/eventTarget';
import {
  Events,
  ItemsChangedEvent,
  createInitEvent,
  createHideOverflowEvent,
  createShowOverflowEvent,
  createItemsChangedEvent,
} from './events/createEvent';

enum El {
  Wrapper = 'wrapper',
  PrimaryNavWrapper = 'primary-nav-wrapper',
  PrimaryNav = 'primary-nav',
  OverflowNav = 'overflow-nav',
  ToggleBtn = 'toggle-btn',
  NavItems = 'nav-item',
}

type NavType = El.PrimaryNav | El.OverflowNav;

enum StateModifiers {
  ButtonVisible = 'is-showing-toggle',
  OverflowVisible = 'is-showing-overflow',
  PrimaryHidden = 'is-hiding-primary',
}

function pplus(targetElem: HTMLElement, options?: Object) {
  const eventChannel = eventTarget();

  const itemMap = new Map();

  const el = {
    primary: {
      [El.Wrapper]: undefined,
      [El.PrimaryNav]: undefined,
      [El.NavItems]: undefined,
      [El.OverflowNav]: undefined,
      [El.ToggleBtn]: undefined,
    },
    clone: {
      [El.Wrapper]: undefined,
      [El.NavItems]: undefined,
      [El.ToggleBtn]: undefined,
    },
  };

  const classNames = {
    [El.Wrapper]: ['p-plus'],
    [El.PrimaryNavWrapper]: ['p-plus__primary-wrapper'],
    [El.PrimaryNav]: ['p-plus__primary'],
    [El.OverflowNav]: ['p-plus__overflow'],
    [El.ToggleBtn]: ['p-plus__toggle-btn'],
  };

  const getElemMirror = (() => {
    const cache = new Map();

    return function getMirror(keyArr: HTMLElement[], valueArr: HTMLElement[]): Map<HTMLElement, HTMLElement> {
      if (!cache.get(keyArr)) {
        cache.set(
          keyArr,
          new Map(Array.from(keyArr).reduce((acc, item, i) => (
            acc.concat([[item, valueArr[i]]])
          ), []))
        );
      }

      return cache.get(keyArr);
    };
  })();

  function cn(key: El): string {
    return classNames[key].join(' ');
  }

  function dv(key: El): string {
    return `data-${key}`;
  }

  function createMarkup(): string {
    return `
      <div ${dv(El.Wrapper)} class="${cn(El.Wrapper)}">
        <div class="${cn(El.PrimaryNavWrapper)}">
          <${targetElem.tagName}
            ${dv(El.PrimaryNav)}
            class="${cn(El.PrimaryNav)}"
          >
            ${Array.from(targetElem.children).map((elem: HTMLElement) => (
              `<li ${dv(El.NavItems)}>${elem.innerHTML}</li>`
            )).join('')}
          </${targetElem.tagName}>
        </div>
        <button
          ${dv(El.ToggleBtn)}
          class="${cn(El.ToggleBtn)}"
          aria-expanded="false"
        >More</button>
        <${targetElem.tagName}
          ${dv(El.OverflowNav)}
          class="${cn(El.OverflowNav)}"
          aria-hidden="true"
        >
        </${targetElem.tagName}>
      <div>
    `;
  }

  function setupEl() {
    const markup = createMarkup();
    const container = document.createDocumentFragment();

    const original = document.createRange().createContextualFragment(markup);
    const cloned = <Element>original.cloneNode(true);

    el.primary[El.Wrapper] = original.querySelector(`[${dv(El.Wrapper)}]`);
    el.primary[El.PrimaryNav] = original.querySelector(`[${dv(El.PrimaryNav)}]`);
    el.primary[El.NavItems] = original.querySelectorAll(`[${dv(El.NavItems)}]`);
    el.primary[El.OverflowNav] = original.querySelector(`[${dv(El.OverflowNav)}]`);
    el.primary[El.ToggleBtn] = original.querySelector(`[${dv(El.ToggleBtn)}]`);

    el.clone[El.Wrapper] = cloned.querySelector(`[${dv(El.Wrapper)}]`);
    el.clone[El.NavItems] = Array.from(cloned.querySelectorAll(`[${dv(El.NavItems)}]`));
    el.clone[El.ToggleBtn] = cloned.querySelector(`[${dv(El.ToggleBtn)}]`);

    el.clone[El.Wrapper].setAttribute('aria-hidden', true);
    el.clone[El.Wrapper].classList.add(`${classNames[El.Wrapper]}--clone`);

    el.clone[El.Wrapper].classList.add(`${classNames[El.Wrapper]}--${StateModifiers.ButtonVisible}`);

    container.appendChild(original);
    container.appendChild(cloned);

    // By default every item belongs in the primary nav, since the intersection
    // observer will run on-load anyway.
    el.clone[El.NavItems].forEach(item => itemMap.set(item, El.PrimaryNav));

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  function updateBtnDisplay(show: Boolean = true) {
    el.primary[El.Wrapper].classList[show ? 'add' : 'remove'](
      `${classNames[El.Wrapper]}--${StateModifiers.ButtonVisible}`,
    );
  }

  function generateNav(navType: NavType): HTMLElement {
    const newNav = el.primary[navType].cloneNode();

    // Always use the clone as the base for our new nav,
    // since the order is canonical and it is never filtered.
    el.clone[El.NavItems]
      .filter(item => itemMap.get(item) === navType)
      .forEach((item) => {
        newNav.appendChild(
          getElemMirror(
            el.clone[El.NavItems],
            el.primary[El.NavItems]
          ).get(item),
        );
      })

    return newNav
  }

  function updateNav(navType: NavType) {
    const newNav = generateNav(navType);

    // Replace the existing nav element in the DOM
    el.primary[navType].parentNode.replaceChild(
      newNav,
      el.primary[navType],
    );

    // Update our reference to it
    el.primary[navType] = newNav;
  }

  // Updates our references
  function onIntersect({ target, intersectionRatio }: IntersectionObserverEntry) {
    itemMap.set(target, intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav);
  }

  function intersectionCallback(events: IntersectionObserverEntry[]) {
    events.forEach(onIntersect);

    [El.PrimaryNav, El.OverflowNav].forEach(updateNav);

    eventChannel.dispatchEvent(createItemsChangedEvent({
      overflowCount: el.primary[El.OverflowNav].children.length,
    }));
  }

  function setOverflowNavOpen(open = true) {
    const openClass = `${classNames[El.Wrapper]}--${StateModifiers.OverflowVisible}`;
    el.primary[El.Wrapper].classList[open ? 'add' : 'remove'](openClass);
    el.primary[El.OverflowNav].setAttribute('aria-hidden', open ? 'false' : 'true');
    el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');

    eventChannel.dispatchEvent(
      open ? createShowOverflowEvent() : createHideOverflowEvent(),
    );
  }

  function toggleOverflowNav() {
    const openClass = `${classNames[El.Wrapper]}--${StateModifiers.OverflowVisible}`;
    setOverflowNavOpen(!el.primary[El.Wrapper].classList.contains(openClass));
  }

  function setPrimaryHidden(hidden = true) {
    const hiddenClass = `${classNames[El.Wrapper]}--${StateModifiers.PrimaryHidden}`;
    el.primary[El.Wrapper].classList[hidden ? 'add' : 'remove'](hiddenClass);
    el.primary[El.PrimaryNav].setAttribute('aria-hidden', hidden);
  }

  function onToggleClick(e: Event) {
    e.preventDefault();
    toggleOverflowNav();
  }

  function onItemsChanged({ detail: { overflowCount } }: ItemsChangedEvent) {
    updateBtnDisplay(overflowCount > 0);

    if (overflowCount === 0) {
      setOverflowNavOpen(false);
    }

    setPrimaryHidden(overflowCount === el.clone[El.NavItems].length);
  }

  function bindListeners() {
    const observer = new IntersectionObserver(intersectionCallback, {
      root: el.clone[El.Wrapper],
      rootMargin: '0px 0px 0px 0px',
      threshold: [1],
    });

    el.clone[El.NavItems].forEach(elem => observer.observe(elem));

    el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);

    eventChannel.addEventListener(Events.ItemsChanged, onItemsChanged);
  }

  function on(eventType: Events, cb: Function) {
    return eventChannel.addEventListener(eventType, cb);
  }

  (function init() {
    setupEl();
    bindListeners();
    eventChannel.dispatchEvent(createInitEvent());
  }());

  return {
    on,
  };
}

export default pplus;
