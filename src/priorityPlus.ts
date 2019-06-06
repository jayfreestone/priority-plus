import {
  createHideOverflowEvent,
  createItemsChangedEvent,
  createShowOverflowEvent,
  Events,
  ItemsChangedEvent,
} from './events/createEvent';
import eventTarget from './events/eventTarget';
import validateAndThrow from './validation';
import createMirror from './utils/createMirror';
import processTemplate from './utils/processTemplate';

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
  classNames?: {
    [El.Container]: string[],
    [El.Main]: string[],
    [El.PrimaryNavWrapper]: string[],
    [El.PrimaryNav]: string[],
    [El.OverflowNav]: string[],
    [El.ToggleBtn]: string[],
  };
  defaultOverflowVisible?: boolean;
  innerToggleTemplate?: string|((args: object) => string);
}

const defaultOptions: Options = {
  classNames: {
    [El.Container]: ['p-plus-container'],
    [El.Main]: ['p-plus'],
    [El.PrimaryNavWrapper]: ['p-plus__primary-wrapper'],
    [El.PrimaryNav]: ['p-plus__primary'],
    [El.OverflowNav]: ['p-plus__overflow'],
    [El.ToggleBtn]: ['p-plus__toggle-btn'],
  },
  defaultOverflowVisible: false,
  innerToggleTemplate: 'More',
};

function priorityPlus(targetElem: HTMLElement, userOptions: Options = {}) {
  /**
   * The instance's event emitter.
   */
  const eventChannel = eventTarget();

  /**
   * A map of navigation list items to their current designation (either the
   * primary nav or the overflow nav), based on if they 'fit'.
   */
  const inst: {
    eventListeners: Map<((eventDetail: object) => void), {
      eventType: Events,
      wrappedCallback: (eventDetail: object) => void,
    }>,
    eventReady: boolean,
    itemMap: WeakMap<HTMLElement|Element, NavType>,
    observer: IntersectionObserver,
  } = {
    eventListeners: new Map(),
    eventReady: false,
    itemMap: new WeakMap(),
    observer: undefined,
  };

  const options: Options = {
    ...defaultOptions,
    ...userOptions,
    classNames: { ...defaultOptions.classNames, ...userOptions.classNames },
  };

  const { classNames } = options;

  /**
   * References to DOM elements so we can easily retrieve them.
   */
  const el: {
    [El.Container]: HTMLElement,
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
    [El.Container]: undefined,
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

  /**
   * Gets an element's 'mirror' Map for the clone/primary navigation - e.g.
   * if you pass a clone Map, you get the original Map and vice-versa.
   */
  const getElemMirror = createMirror();

  /**
   * Generates classes based on an element name.
   */
  function cn(key: El): string {
    return classNames[key].join(' ');
  }

  /**
   * Generates data-attributes based on an element name. These are used to query
   * the generated DOM and populate the 'el' object.
   */
  function dv(key: El): string {
    return `data-${key}`;
  }

  /**
   * Generates the HTML to use in-place of the user's supplied element.
   */
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

  /**
   * Replaces the navigation with the two clones and populates the 'el' object.
   */
  function setupEl() {
    const { itemMap } = inst;
    const markup = createMarkup();
    const container = document.createElement('div');
    container.classList.add(...classNames[El.Container]);
    container.setAttribute(dv(El.Container), 'true');
    el[El.Container] = container;

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
    el.clone[El.Main].setAttribute('data-clone', 'true');
    el.clone[El.Main].classList.add(`${classNames[El.Main][0]}--clone`);

    el.clone[El.Main].classList.add(`${classNames[El.Main][0]}--${StateModifiers.ButtonVisible}`);

    container.appendChild(original);
    container.appendChild(cloned);

    // By default every item belongs in the primary nav, since the intersection
    // observer will run on-load anyway.
    el.clone[El.NavItems].forEach(item => itemMap.set(item, El.PrimaryNav));

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  /**
   * Sets the toggle button visibility.
   */
  function updateBtnDisplay(show: boolean = true) {
    el.primary[El.Main].classList[show ? 'add' : 'remove'](
      `${classNames[El.Main][0]}--${StateModifiers.ButtonVisible}`,
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

  /**
   * (Re) generate the navigation list for either the visible or the overflow nav.
   * We use this to completely recreate the nav each time we update it,
   * avoiding ordering complexity and having to run append multiple times on
   * the mounted nav.
   */
  function generateNav(navType: NavType): HTMLElement {
    const { itemMap } = inst;
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

  /**
   * Replaces the passed in nav type with a newly generated copy in the DOM.
   */
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

  /**
   * Run every time a nav item intersects with the parent container.
   * We use this opportunity to check which type of nav the items belong to.
   */
  function onIntersect({ target, intersectionRatio }: IntersectionObserverEntry) {
    inst.itemMap.set(target, intersectionRatio < 0.99 ? El.OverflowNav : El.PrimaryNav);
  }

  /**
   * The IO callback, which collects intersection events.
   */
  function intersectionCallback(events: IntersectionObserverEntry[]) {
    // Update the designation
    events.forEach(onIntersect);

    // Update the navs to reflect the new changes
    [El.PrimaryNav, El.OverflowNav].forEach(updateNav);

    eventChannel.dispatchEvent(createItemsChangedEvent({
      overflowCount: el.primary[El.OverflowNav].children.length,
    }));

    /**
     * Once this callback is run, we can be confident that we are ready to pass on
     * events to users. If we do so beforehand, internal initialisation events (e.g.
     * the first itemsChanged and showOverflow events) will be sent to user-defined
     * listeners.
     */
    inst.eventReady = true;
  }

  /**
   * Sets the visibility of the overflow navigation.
   */
  function setOverflowNavOpen(open = true) {
    const openClass = `${classNames[El.Main][0]}--${StateModifiers.OverflowVisible}`;
    el.primary[El.Main].classList[open ? 'add' : 'remove'](openClass);
    el.primary[El.OverflowNav].setAttribute('aria-hidden', open ? 'false' : 'true');
    el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');

    eventChannel.dispatchEvent(
      open ? createShowOverflowEvent() : createHideOverflowEvent(),
    );

    return this;
  }

  /**
   * Toggles the visibility of the overflow navigation.
   */
  function toggleOverflowNav() {
    const openClass = `${classNames[El.Main][0]}--${StateModifiers.OverflowVisible}`;
    setOverflowNavOpen(!el.primary[El.Main].classList.contains(openClass));

    return this;
  }

  /**
   * Sets the visibility of the primary navigation (we hide the primary nav
   * when all the navigation items are hidden in the overflow nav).
   */
  function setPrimaryHidden(hidden = true) {
    const hiddenClass = `${classNames[El.Main][0]}--${StateModifiers.PrimaryHidden}`;
    el.primary[El.Main].classList[hidden ? 'add' : 'remove'](hiddenClass);
    el.primary[El.PrimaryNav].setAttribute('aria-hidden', String(hidden));
  }

  /**
   * Handle the overflow-nav toggle btn click.
   */
  function onToggleClick(e: Event) {
    e.preventDefault();
    toggleOverflowNav();
  }

  /**
   * Callback for when either nav is updated.
   */
  function onItemsChanged({ detail: { overflowCount } }: ItemsChangedEvent) {
    updateBtnDisplay(overflowCount > 0);

    if (overflowCount === 0) {
      setOverflowNavOpen(false);
    }

    setPrimaryHidden(overflowCount === el.clone[El.NavItems].length);
  }

  /**
   * Registers an an event listener for the instance.
   * By default the callback will only be run after the first-load of the library.
   * However this can be overridden by setting 'afterReady' to 'false'.
   */
  function on(eventType: Events, cb: (eventDetail: object) => void, afterReady = true) {
    function wrappedCallback(event) {
      if (!afterReady || inst.eventReady) cb(event);
    }

    // Store it so we can remove it later
    inst.eventListeners.set(cb, { eventType, wrappedCallback });
    eventChannel.addEventListener(eventType, wrappedCallback);

    return this;
  }

  /**
   * Removes an event listener.
   */
  function off(eventType: Events, cb: (eventDetail: object) => void) {
    const { wrappedCallback } = inst.eventListeners.get(cb);
    eventChannel.removeEventListener(eventType, wrappedCallback);

    return this;
  }

  /**
   * Retrieves an index of the primary nav elements.
   */
  function getNavElements() {
    // Clone it to avoid users changing the el references,
    // e.g. inst.getNavElements()['toggle-btn'] = null;
    return {...el.primary};
  }

  /**
   * Establishes initial event listeners.
   */
  function bindListeners() {
    inst.observer = new IntersectionObserver(intersectionCallback, {
      root: el.clone[El.Main],
      rootMargin: '0px 0px 0px 0px',
      threshold: [0.99],
    });

    el.clone[El.NavItems].forEach(elem => inst.observer.observe(elem));

    el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);

    on(Events.ItemsChanged, onItemsChanged, false);
  }

  /**
   * Remove listeners and attempt to reset the DOM.
   */
  function destroy() {
    inst.observer.disconnect();

    el.primary[El.ToggleBtn].removeEventListener('click', onToggleClick);

    // Unhook instance based event listeners
    Array.from(inst.eventListeners.entries())
      .forEach(([cb, { eventType }]) => {
        off(eventType, cb);
      });

    // Attempt to reset the DOM back to how it was
    el[El.Container].parentNode.replaceChild(targetElem, el[El.Container]);
  }

  (function init() {
    validateAndThrow(targetElem, userOptions, defaultOptions),
    setupEl();
    bindListeners();
    if (options.defaultOverflowVisible) setOverflowNavOpen(true);
  }());

  return {
    destroy,
    getNavElements,
    off,
    on,
    setOverflowNavOpen,
    toggleOverflowNav,
  };
}

export default priorityPlus;
