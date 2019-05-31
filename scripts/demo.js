Array.from(document.querySelectorAll('.js-p-target')).forEach((target) => {
  pplus(target);
});

function resizeable(elem) {
  const $control = elem.querySelector('.js-resizeable__control');
  const $target = elem.querySelector('.js-resizeable__target');

  function updateTargetWidth(width = $control.value) {
    $target.style.maxWidth = `${width}%`;
  }

  function handleOnControlChange() {
    updateTargetWidth();
  }

  $control.addEventListener('input', handleOnControlChange);
}

Array.from(document.querySelectorAll('.js-resizeable')).forEach((elem) => {
  resizeable(elem);
});


// inst.on('itemsChanged', ({ detail: { overflowCount } }) => {
//   console.log('We now have this many items in the overflow: ', overflowCount);
// });

// const inst = pplus(document.querySelector('.js-p-target'));

// inst.on('itemsChanged', ({ detail: { overflowCount } }) => {
//   console.log('We now have this many items in the overflow: ', overflowCount);
// });
