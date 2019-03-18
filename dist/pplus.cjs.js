'use strict';

function pplus(targetElem, options) {
  const el = {
    wrapper: undefined,
    clonedWrapper: undefined,
    // wrapper: undefined,
    // primaryNavWrapper: undefined,
    // primaryNav: undefined,
    // overflowNav: undefined,
    // navItems: undefined,
    // clonedTarget: undefined,
    // clonedNavItems: undefined,
  };

  const classNames = {
    wrapper: ['p-plus'],
    primaryNavWrapper: ['p-plus__primary-wrapper'],
    primaryNav: ['p-plus__primary'],
    overflowNav: ['p-plus__overflow'],
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
              `<li 
                data-nav-item
                data-item="${elem.innerText}"
               >${elem.innerHTML}</li>`
            )).join('')}
          </${targetElem.tagName}>
        </div>
          <${targetElem.tagName} 
            data-overflow-nav
            class="${classNames.overflowNav.join(' ')}"
          >
          </${targetElem.tagName}>
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
    el.clonedWrapper = cloned.querySelector('[data-wrapper]');
    el.clonedNavItems = cloned.querySelectorAll('[data-nav-item]');

    container.appendChild(original);
    container.appendChild(cloned);

    targetElem.parentNode.replaceChild(container, targetElem);
  }

  // function setupEl() {
  //   el.wrapper = document.createElement('div');
  //   el.wrapper.className = classNames.wrapper.join(' ');
  //
  //   el.primaryNav = document.createElement(targetElem.tagName);
  //   el.primaryNav.className = classNames.primaryNav.join(' ');
  //   el.overflowNav = document.createElement(targetElem.tagName);
  //   el.overflowNav.className = classNames.overflowNav.join(' ');
  //
  //   el.primaryNavWrapper = document.createElement('div');
  //   el.primaryNavWrapper.className = classNames.primaryNavWrapper.join(' ');
  //
  //   el.toggleBtn = document.createElement('button');
  //   el.toggleBtn.innerHTML = 'More';
  //
  //   el.primaryNavWrapper.appendChild(el.primaryNav);
  //   el.wrapper.appendChild(el.primaryNavWrapper);
  //   el.wrapper.appendChild(el.overflowNav);
  //   el.wrapper.appendChild(el.toggleBtn);
  //
  //   el.navItems = [].map.call(targetElem.children, elem => {
  //     elem.setAttribute('data-item', elem.innerText);
  //     return elem;
  //   });
  //
  //   el.navItems.forEach(elem => el.primaryNav.appendChild(elem));
  //
  //   el.clonedWrapper = el.wrapper.cloneNode(true);
  //
  //   const container = document.createDocumentFragment();
  //   container.appendChild(el.clonedWrapper);
  //   container.appendChild(el.wrapper);
  //
  //   targetElem.parentNode.replaceChild(container, targetElem);
  // }

  function onIntersect(e) {
    e.forEach((item) => {
      console.log(item, item.target);

      if (item.intersectionRatio < 1) {
        const id = item.target.getAttribute('data-item');
        const target = el.primaryNav.querySelector(`li[data-item="${id}"]`);

        if (!target) return;

        const clone = target.cloneNode(true);
        target.remove();
        el.overflowNav.appendChild(clone);
      } else if (el.overflowNav.children.length) {
        const clone = el.overflowNav.lastElementChild.cloneNode(true);
        el.overflowNav.lastElementChild.remove();
        el.primaryNav.appendChild(clone);
      }
    });
  }

  function bindListeners() {
    const observer = new IntersectionObserver(onIntersect, {
      root: el.wrapper,
      rootMargin: '0px 0px 0px 0px',
      threshold: [.25, .50, .75, 1],
    });

    // el.clonedNavItems.forEach(elem => {
    //   observer.observe(elem);
    // });
  }

  (function init() {
    setupEl();
    bindListeners();
  }());

  return {
    el,
  };
}

module.exports = pplus;
