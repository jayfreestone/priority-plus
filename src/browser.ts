// Wrapper around library which exposes `priorityPlus` as a global
// on `window`. Required as `globalName` will nest the default export
// under `.default`.
// See: https://github.com/evanw/esbuild/issues/869
import lib from './priorityPlus';
// Required so that esbuild spits out the CSS. We don't include it in
// the main `priorityPlus.ts` file since that would result in two files.
import './css/priority-plus.css';

// @ts-ignore
window.priorityPlus = lib;
