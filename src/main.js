function pplus(targetElem, options) {
  const el = {
    wrapper: undefined,
    clonedWrapper: undefined,
    primaryNav: undefined,
    overflowNav: undefined,
    toggleBtn: undefined,
    clonedToggleBtn: undefined,
    clonedNavItems: undefined,
  };

  const navItemMaps = {
    primary: undefined,
  };

  const classNames = {
    wrapper: ['p-plus'],
    primaryNavWrapper: ['p-plus__primary-wrapper'],
    primaryNav: ['p-plus__primary'],
    overflowNav: ['p-plus__overflow'],
    toggleBtn: ['p-plus__toggle-btn'],
  };

  function createMarkup() {
    return `
      <div data-wrapper class="${classNames.wrapper.join(' ')}">
        <div class="${classNames.primaryNavWrapper.join(' ')}">
          <${targetElem.tagName} 
            data-primary-nav
            class="${classNames.primaryNav.join(' ')}"
          >
            ${[].map.call(targetElem.children, elem => (
              `<li data-nav-item>${elem.innerHTML}</li>`
            )).join('')}
          </${targetElem.tagName}>
        </div>
        <${targetElem.tagName} 
          data-overflow-nav
          class="${classNames.overflowNav.join(' ')}"
        >
        </${targetElem.tagName}>
        <button
          data-toggle-btn
          class="${classNames.toggleBtn.join(' ')}"
        >More</button>
      <div>
    `;
  }

  function setupEl() {
    const markup = createMarkup();
    const container = document.createDocumentFragment();

    const original = document.createRange().createContextualFragment(markup);
    const cloned = original.cloneNode(true);

    el.wrapper = original.querySelector('[data-wrapper]');
    el.primaryNav = original.querySelector('[data-primary-nav]');
    el.overflowNav = original.querySelector('[data-overflow-nav]');
    el.toggleBtn = original.querySelector('[data-toggle-btn]');
    el.toggleBtn.style.display = 'none';
    el.clonedWrapper = cloned.querySelector('[data-wrapper]');
    el.primaryNavItems = original.querySelectorAll('[data-nav-item]');
    el.clonedNavItems = cloned.querySelectorAll('[data-nav-item]');
    el.clonedToggleBtn = cloned.querySelector('[data-toggle-btn]');

    const mergedByIndex = Array.from(el.clonedNavItems)
      .reduce((acc, item, i) => (
        acc.concat([[item, el.primaryNavItems[i]]])
      ), []);

    navItemMaps.byClone = new Map(mergedByIndex);

    container.appendChild(original);
    container.appendChild(cloned);

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  function onIntersect({ target, intersectionRatio }) {
    const targetElem = navItemMaps.byClone.get(target);
    const navToPopulate = intersectionRatio < 1 ? 'overflowNav' : 'primaryNav';

    if (!targetElem) return;

    targetElem.remove();
    el[navToPopulate].appendChild(targetElem);

    updateBtnDisplay();
  }

  function updateBtnDisplay() {
    [el.toggleBtn, el.clonedToggleBtn].forEach((btn) => {
      btn.style.display = el.overflowNav.children.length > 0 ? 'block' : 'none';
    })
  }

  function bindListeners() {
    const observer = new IntersectionObserver(e => e.forEach(onIntersect), {
      root: el.clonedWrapper,
      rootMargin: '0px 0px 0px 0px',
      threshold: [0, 1],
    });

    el.clonedNavItems.forEach(elem => observer.observe(elem));
  }

  (function init() {
    setupEl();
    bindListeners();
  }());

  return {
    el,
  };
}

export default pplus;
