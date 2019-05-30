enum El {
  Wrapper = 'wrapper',
  PrimaryNavWrapper = 'primary-nav-wrapper',
  PrimaryNav = 'primary-nav',
  OverflowNav = 'overflow-nav',
  ToggleBtn = 'toggle-btn',
  NavItems = 'nav-item',
}

enum StateModifiers {
  ButtonVisible = 'is-showing-toggle',
  OverflowVisible = 'is-showing-overflow',
}

function eventTarget() {
  const { port1 } = new MessageChannel();
  return {
    dispatchEvent: port1.dispatchEvent.bind(port1),
    addEventListener: port1.addEventListener.bind(port1),
  };
}

function pplus(targetElem, options) {
  const eventChannel = eventTarget();

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

  const stateClassNames = {

  };

  const getElemMirror = (() => {
    const cache = new Map();

    return function getMirror(keyArr, valueArr) {
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

  function cn(key: El) {
    return classNames[key].join(' ');
  }

  function dv(key: El) {
    return `data-${key}`;
  }

  function createMarkup() {
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

    container.appendChild(original);
    container.appendChild(cloned);

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  function onIntersect({ target, intersectionRatio }) {
    const targetElem = getElemMirror(el.clone[El.NavItems], el.primary[El.NavItems]).get(target);
    const navToPopulate = intersectionRatio < 1 ? El.OverflowNav : El.PrimaryNav;

    if (!targetElem) return;

    targetElem.remove();
    el.primary[navToPopulate].appendChild(targetElem);

    updateBtnDisplay();

    if (el.primary[El.OverflowNav].children.length === 0) {
      setOverflowNavOpen(false);
    }
  }

  function updateBtnDisplay() {
    const show = el.primary[El.OverflowNav].children.length > 0;

    [el.primary[El.Wrapper], el.clone[El.Wrapper]].forEach((wrapper) => {
      wrapper.classList[show ? 'add' : 'remove'](
        `${classNames[El.Wrapper]}--${StateModifiers.ButtonVisible}`
      );
    })
  }

  function intersectionCallback(e) {
    e.forEach(onIntersect);
    eventChannel.dispatchEvent(new CustomEvent('intersect'));
  }

  function setOverflowNavOpen(open = true) {
    const openClass = `${classNames[El.Wrapper]}--${StateModifiers.OverflowVisible}`;
    el.primary[El.Wrapper].classList[open ? 'add' : 'remove'](openClass);
    el.primary[El.ToggleBtn].setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function toggleOverflowNav() {
    const openClass = `${classNames[El.Wrapper]}--${StateModifiers.OverflowVisible}`;
    setOverflowNavOpen(!el.primary[El.Wrapper].classList.contains(openClass));
  }

  function onToggleClick(e) {
    e.preventDefault();
    toggleOverflowNav();
  }

  function bindListeners() {
    const observer = new IntersectionObserver(intersectionCallback, {
      root: el.clone[El.Wrapper],
      rootMargin: '0px 0px 0px 0px',
      threshold: [0, 1],
    });

    el.clone[El.NavItems].forEach(elem => observer.observe(elem));

    el.primary[El.ToggleBtn].addEventListener('click', onToggleClick);
  }

  function on(eventType, cb) {
    return eventChannel.addEventListener(eventType, cb);
  }

  (function init() {
    setupEl();
    bindListeners();
    eventChannel.dispatchEvent(new CustomEvent('init'));
  }());

  return {
    on,
  };
}

export default pplus;