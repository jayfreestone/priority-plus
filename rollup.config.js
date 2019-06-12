import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  {
    input: 'src/priorityPlus.ts',
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
      { name: 'priorityPlus', file: pkg.browser, format: 'umd' },
    ],
    plugins: [
      typescript(),
      terser(),
    ],
  },
];
