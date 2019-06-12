/**
 * Joins an array of error messages into one message.
 */
export function throwValidation(errors?: string[]) {
  if (errors && errors.length) throw new Error(`\n- ${errors.join('\n- ')}`);
}

/**
 * Confirms the target DOM element is of the required type.
 */
export function validateTarget(targetElem: HTMLElement) {
  return [
    (!(targetElem instanceof Element))
      && 'Target must be an HTMLElement.',
    (!targetElem.children || !targetElem.children.length)
      && 'Target must be the direct parent of the individual nav items.',
  ].filter(Boolean) as string[];
}

/**
 * Confirms that the top-level options keys are valid. Does not check type.
 */
export function validateOptions(userOptions: object, defaultOptions: { [x: string]: any }) {
  return Object.keys(userOptions)
    .map(key => typeof defaultOptions[key] === 'undefined' ? `Unrecognised option: ${key}` : undefined)
    .filter(Boolean) as string[];
}

/**
 * Collects validation messages into one array.
 */
export function validateInput(targetElem: HTMLElement, userOptions: object, defaultOptions: object) {
  return [...validateTarget(targetElem), ...validateOptions(userOptions, defaultOptions)];
}

/**
 * Throws an error if any error messages are returned from validation.
 */
export function validateAndThrow(targetElem: HTMLElement, userOptions: object, defaultOptions: object) {
  throwValidation(
    validateInput(targetElem, userOptions, defaultOptions),
  );
}

export default validateAndThrow;
