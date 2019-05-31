  const inst = pplus(document.querySelector('.js-p-target'));

  inst.on('itemsChanged', ({ detail: { overflowCount } }) => {
    console.log('We now have this many items in the overflow: ', overflowCount);
  });
