import deepmerge from 'deepmerge';
import {
  createHideOverflowEvent,
  createInitEvent,
  createItemsChangedEvent,
  createShowOverflowEvent,
  Events,
  ItemsChangedEvent,
} from './events/createEvent';
import eventTarget from './events/eventTarget';
import validateAndThrow from './validation';

enum El {
  Container = 'container',
  Main = 'main',
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

interface Options {
  innerToggleTemplate?: string|((args: object) => string);
  classNames?: {
    [El.Container]: string[],
    [El.Main]: string[],
    [El.PrimaryNavWrapper]: string[],
    [El.PrimaryNav]: string[],
    [El.OverflowNav]: string[],
    [El.ToggleBtn]: string[],
  };
}

function pplus(targetElem: HTMLElement, userOptions?: Options) {
  const eventChannel = eventTarget();

  const itemMap = new Map();

  const defaultOptions: Options = {
    classNames: {
      [El.Container]: ['p-plus-container'],
      [El.Main]: ['p-plus'],
      [El.PrimaryNavWrapper]: ['p-plus__primary-wrapper'],
      [El.PrimaryNav]: ['p-plus__primary'],
      [El.OverflowNav]: ['p-plus__overflow'],
      [El.ToggleBtn]: ['p-plus__toggle-btn'],
    },
    innerToggleTemplate: 'More',
  };

  const options: Options = deepmerge(
    defaultOptions,
    userOptions || {},
    { arrayMerge: (_, source) => source },
  );

  const { classNames } = options;

  const el: {
    clone: {
      [El.Main]: HTMLElement,
      [El.NavItems]: HTMLElement[],
      [El.ToggleBtn]: HTMLElement,
    },
    primary: {
      [El.Main]: HTMLElement,
      [El.PrimaryNav]: HTMLElement,
      [El.NavItems]: HTMLElement[],
      [El.OverflowNav]: HTMLElement,
      [El.ToggleBtn]: HTMLElement,
    },
  } = {
    clone: {
      [El.Main]: undefined,
      [El.NavItems]: undefined,
      [El.ToggleBtn]: undefined,
    },
    primary: {
      [El.Main]: undefined,
      [El.PrimaryNav]: undefined,
      [El.NavItems]: undefined,
      [El.OverflowNav]: undefined,
      [El.ToggleBtn]: undefined,
    },
  };

  const getElemMirror = (() => {
    const cache = new Map();

    return function getMirror(keyArr: HTMLElement[], valueArr: HTMLElement[]): Map<HTMLElement, HTMLElement> {
      if (!cache.get(keyArr)) {
        cache.set(
          keyArr,
          new Map(Array.from(keyArr).reduce((acc, item, i) => (
            acc.concat([[item, valueArr[i]]])
          ), [])),
        );
      }

      return cache.get(keyArr);
    };
  })();

  function processTemplate(input: string|((args: object) => string), args = {}): string {
    if (typeof input === 'string') return input;
    return input(args);
  }

  function cn(key: El): string {
    return classNames[key].join(' ');
  }

  function dv(key: El): string {
    return `data-${key}`;
  }

  function createMarkup(): string {
    return `
      <div ${dv(El.Main)} class="${cn(El.Main)}">
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
        >${processTemplate(options.innerToggleTemplate)}</button>
        <${targetElem.tagName}
          ${dv(El.OverflowNav)}
          class="${cn(El.OverflowNav)}"
          aria-hidden="true"
        >
        </${targetElem.tagName}>
      </div>
    `;
  }

  function setupEl() {
    const markup = createMarkup();
    const container = document.createElement('div');
    container.classList.add(...classNames[El.Container]);

    const original = document.createRange().createContextualFragment(markup);
    const cloned = original.cloneNode(true) as Element;

    el.primary[El.Main] = original.querySelector(`[${dv(El.Main)}]`);
    el.primary[El.PrimaryNav] = original.querySelector(`[${dv(El.PrimaryNav)}]`);
    el.primary[El.NavItems] = Array.from(original.querySelectorAll(`[${dv(El.NavItems)}]`));
    el.primary[El.OverflowNav] = original.querySelector(`[${dv(El.OverflowNav)}]`);
    el.primary[El.ToggleBtn] = original.querySelector(`[${dv(El.ToggleBtn)}]`);

    el.clone[El.Main] = cloned.querySelector(`[${dv(El.Main)}]`);
    el.clone[El.NavItems] = Array.from(cloned.querySelectorAll(`[${dv(El.NavItems)}]`));
    el.clone[El.ToggleBtn] = cloned.querySelector(`[${dv(El.ToggleBtn)}]`);

    el.clone[El.Main].setAttribute('aria-hidden', 'true');
    el.clone[El.Main].classList.add(`${classNames[El.Main]}--clone`);

    el.clone[El.Main].classList.add(`${classNames[El.Main]}--${StateModifiers.ButtonVisible}`);

    container.appendChild(original);
    container.appendChild(cloned);

    // By default every item belongs in the primary nav, since the intersection
    // observer will run on-load anyway.
    el.clone[El.NavItems].forEach(item => itemMap.set(item, El.PrimaryNav));

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  function updateBtnDisplay(show: boolean = true) {
    el.primary[El.Main].classList[show ? 'add' : 'remove'](
      `${classNames[El.Main]}--${StateModifiers.ButtonVisible}`,
    );

    if (typeof options.innerToggleTemplate !== 'string') {
      // We need to do it for both, as layout is affected
      [el.primary[El.ToggleBtn], el.clone[El.ToggleBtn]].forEach(btn => {
        btn.innerHTML = processTemplate(options.innerToggleTemplate, {
          toggleCount: el.primary[El.OverflowNav].children.length,
          totalCount: el.clone[El.NavItems].length,
        });
      });
    }
  }

  function generateNav(navType: NavType): HTMLElement {
    const newNav = el.primary[navType].cloneNode();

    // Always use the clone as the base for our new nav,
    // since the order is canonical and it is never filtered.
    el.clone[El.NavItems]
      .filter(item => itemMap.get(item) === navType)
      .forEach(item => {
        newNav.appendChild(
          getElemMirror(
            el.clone[El.NavItems],
            el.primary[El.NavItems],
          ).get(item),
        );
      });

    return newNav as HTMLElement;
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
    const openClass = `${classNames[El.Main]}--${StateModifiers.OverflowVisible}`;
    el.primary[El.Main].classList[open ? 'add' : 'remove'](openClass);
    el.primary[El.OverflowNav].setAttribute('aria-hidden', open ? 'false' : 'true');
    el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');

    eventChannel.dispatchEvent(
      open ? createShowOverflowEvent() : createHideOverflowEvent(),
    );
  }

  function toggleOverflowNav() {
    const openClass = `${classNames[El.Main]}--${StateModifiers.OverflowVisible}`;
    setOverflowNavOpen(!el.primary[El.Main].classList.contains(openClass));
  }

  function setPrimaryHidden(hidden = true) {
    const hiddenClass = `${classNames[El.Main]}--${StateModifiers.PrimaryHidden}`;
    el.primary[El.Main].classList[hidden ? 'add' : 'remove'](hiddenClass);
    el.primary[El.PrimaryNav].setAttribute('aria-hidden', String(hidden));
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
      root: el.clone[El.Main],
      rootMargin: '0px 0px 0px 0px',
      threshold: [1],
    });

    el.clone[El.NavItems].forEach(elem => observer.observe(elem));

    el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);

    eventChannel.addEventListener(Events.ItemsChanged, onItemsChanged);
  }

  function on(eventType: Events, cb: (eventDetail: object) => void) {
    return eventChannel.addEventListener(eventType, cb);
  }

  (function init() {
    validateAndThrow(targetElem, userOptions, defaultOptions),
    setupEl();
    bindListeners();
    eventChannel.dispatchEvent(createInitEvent());
  }());

  return {
    on,
  };
}

export default pplus;
