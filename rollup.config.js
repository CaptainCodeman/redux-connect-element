'use strict';

import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import { sizeSnapshot } from "rollup-plugin-size-snapshot";

export default [{
  input: 'src/connect.ts',
  output: {
    file: 'dist/' + pkg.main,
    format: 'cjs',
    name: 'connect',
  },
  plugins: [
    resolve(),
    typescript({
      typescript: require('typescript'),
    }),
  ],
}, {
  input: 'src/connect.ts',
  output: {
    file: 'dist/' + pkg.browser,
    format: 'iife',
    name: 'connect',
  },
  plugins: [
    resolve(),
    typescript({
      typescript: require('typescript'),
    }),
    sizeSnapshot(),
    terser(),
  ],
}]
