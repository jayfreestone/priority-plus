(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.pplus = factory());
}(this, function () { 'use strict';

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
      el.clonedWrapper = cloned.querySelector('[data-wrapper]');
      el.clonedNavItems = cloned.querySelectorAll('[data-nav-item]');
      el.clonedToggleBtn = cloned.querySelector('[data-toggle-btn]');

      container.appendChild(original);
      container.appendChild(cloned);

      targetElem.parentNode.replaceChild(container, targetElem);
    }


    function onIntersect(e) {
      e.forEach((item) => {
        const overflowChildrenLen = el.overflowNav.children.length;
        console.log(item);

        if (item.intersectionRatio < 1) {
          const id = item.target.getAttribute('data-item');
          const target = el.primaryNav.querySelector(`li[data-item="${id}"]`);

          if (!target) return;

          const clone = target.cloneNode(true);
          target.remove();
          el.overflowNav.appendChild(clone);
        } else if (overflowChildrenLen) {
          const clone = el.overflowNav.lastElementChild.cloneNode(true);
          el.overflowNav.lastElementChild.remove();
          el.primaryNav.appendChild(clone);
        }

        updateBtnDisplay();
      });
    }

    function updateBtnDisplay() {
      [el.toggleBtn, el.clonedToggleBtn].forEach((btn) => {
        btn.style.display = el.overflowNav.children.length > 0 ? 'block' : 'none';
      });
    }

    function bindListeners() {
      const observer = new IntersectionObserver(onIntersect, {
        root: el.clonedWrapper,
        rootMargin: '0px 0px 0px 0px',
        threshold: [0, 1],
      });

      el.clonedNavItems.forEach(elem => observer.observe(elem));
    }

    (function init() {
      setupEl();
      // updateBtnDisplay();
      bindListeners();
    }());

    return {
      el,
    };
  }

  return pplus;

}));
