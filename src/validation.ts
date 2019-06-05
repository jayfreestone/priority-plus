/**
 * Joins an array of error messages into one message.
 */
function throwValidation(errors?: string[]) {
  if (errors && errors.length) throw new Error(`\n- ${errors.join('\n- ')}`);
}

/**
 * Confirms the target DOM element is of the required type.
 */
function validateTarget(targetElem: HTMLElement) {
  return [
    (!(targetElem instanceof Element))
      && 'Target must be an HTMLElement.',
    (!targetElem.children || !targetElem.children.length)
      && 'Target must be the direct parent of the individual nav items.',
  ].filter(Boolean);
}

/**
 * Confirms that the top-level options keys are valid. Does not check type.
 */
function validateOptions(userOptions: object, defaultOptions: object) {
  return Object.keys(userOptions)
    .map(key => typeof defaultOptions[key] === 'undefined' ? `Unrecognised option: ${key}` : undefined)
    .filter(Boolean);
}

/**
 * Collects validation messages into one array.
 */
function validateInput(targetElem: HTMLElement, userOptions: object, defaultOptions: object) {
  return [...validateTarget(targetElem), ...validateOptions(userOptions, defaultOptions)];
}

/**
 * Throws an error if any error messages are returned from validation.
 */
function validateAndThrow(targetElem: HTMLElement, userOptions: object, defaultOptions: object) {
  throwValidation(
    validateInput(targetElem, userOptions, defaultOptions),
  );
}

export default validateAndThrow;
