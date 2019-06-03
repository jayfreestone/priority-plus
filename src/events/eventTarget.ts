function eventTarget() {
  const { port1 } = new MessageChannel();
  return {
    addEventListener: port1.addEventListener.bind(port1),
    dispatchEvent: port1.dispatchEvent.bind(port1),
  };
}

export default eventTarget;
