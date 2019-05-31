function eventTarget() {
  const { port1 } = new MessageChannel();
  return {
    dispatchEvent: port1.dispatchEvent.bind(port1),
    addEventListener: port1.addEventListener.bind(port1),
  };
}

export default eventTarget;
