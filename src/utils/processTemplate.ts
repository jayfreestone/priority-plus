/**
 * Takes a string/function template and returns a DOM string.
 */
function processTemplate(input: string|((args: object) => string), args = {}): string {
  if (typeof input === 'string') return input;
  return input(args);
}

export default processTemplate;
