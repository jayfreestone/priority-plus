export default function pplus() {
  const target = document.querySelector('.p-plus')
  const primaryNav = target.querySelector('.p-plus__primary');
  const overflowNav = target.querySelector('.p-plus__overflow');

  const clonedTarget = target.cloneNode(true);
  const clonedNavItems = Array.from(clonedTarget.querySelectorAll('.p-plus__primary > li'));
  document.body.appendChild(clonedTarget);

  function callback(e) {
    e.forEach((item) => {
      console.log(item, item.target);

      if (item.intersectionRatio < 1) {
        const id = item.target.getAttribute('data-item');
        const target = primaryNav.querySelector(`li[data-item="${id}"]`);

        if (!target) return;

        const clone = target.cloneNode(true);
        target.remove();
        overflowNav.appendChild(clone);
      } else if (overflowNav.childNodes.length) {
        const clone = overflowNav.lastElementChild.cloneNode(true);
        overflowNav.lastElementChild.remove();
        primaryNav.appendChild(clone);
      }

      // else if (overflowNav.childNodes.length) {
      //   const clone = overflowNav.lastElementChild.cloneNode(true);
      //   overflowNav.lastElementChild.remove();
      //   primaryNav.appendChild(clone);
      // }
    });
  }

  const observer = new IntersectionObserver(callback, {
    root: clonedTarget,
    rootMargin: '0px 0px 0px 0px',
    threshold: [.25, .50, .75, 1],
  });

  clonedNavItems.forEach(elem => {
    observer.observe(elem);
  });
};
