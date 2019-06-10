function resizeable(elem) {
  const $control = elem.querySelector('.js-resizeable__control');
  const $target = elem.querySelector('.js-resizeable__target');

  function updateTargetWidth(width = $control.value) {
    $target.style.maxWidth = `${width}%`;
  }

  function handleOnControlChange() {
    updateTargetWidth();
  }

  function setValue(newValue) {
    $control.value = newValue;
    $control.dispatchEvent(new Event('input'));
  }

  $control.addEventListener('input', handleOnControlChange);

  return {
    setValue,
  };
}

Array.from(document.querySelectorAll('.js-p-target')).forEach((target) => {
  priorityPlus(target, {
    innerToggleTemplate: ({ totalCount, toggleCount }) =>
      toggleCount === totalCount
        ? 'Menu'
        : `<span aria-label="More">+ (${toggleCount})</span>`,
  });
});

const resizeableInstances = Array.from(document.querySelectorAll('.js-resizeable'))
  .map(resizeable);

window.matchMedia('(max-width: 60rem)').addListener(({ matches }) => {
  if (matches) {
    resizeableInstances.forEach(inst => inst.setValue(100));
  }
});

