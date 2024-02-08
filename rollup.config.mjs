/* eslint-disable import/no-extraneous-dependencies, import/no-default-export */

// Using rollup-plugin-typescript2 rather than the official one as there are problems
// with generating type declarations
// https://github.com/rollup/plugins/issues/105
// https://github.com/rollup/plugins/issues/247
//
// import typescript from '@rollup/plugin-typescript'
import typescript from 'rollup-plugin-typescript2';
import copy from 'rollup-plugin-copy';

import pkg from './package.json' assert { type: 'json' };

// rollup-plugin-banner does not work anymore and the default banner will do since there are no
// minified builds.
const createBanner = (lines) => `/**\n${lines.map((l) => ` * ${l}\n`).join('')} */`;

const banner = createBanner([
  `${pkg.name} v${pkg.version}`,
  `Copyright (c) 2024 ${pkg.author}`,
  `License: ${pkg.license}`,
]);

const defaults = {
  input: 'src/index.ts',
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
};

export default [
  // ESM build + type declarations
  {
    ...defaults,
    output: {
      file: pkg.exports['.'].import.default,
      format: 'es',
      banner,
    },
    plugins: [
      typescript({
        tsconfig: 'tsconfig.json',
        tsconfigOverride: {
          compilerOptions: {
            declaration: true,
            declarationDir: './dist',
          },
          exclude: ['./test'],
        },
        useTsconfigDeclarationDir: true,
      }),
    ],
  },

  // Common JS build
  {
    ...defaults,
    output: {
      file: pkg.exports['.'].require.default,
      format: 'cjs',
      banner,
    },
    plugins: [
      typescript(),
      copy({
        targets: [
          // TypeScript requires 2 distinct files for ESM and CJS types. See:
          // https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/
          // https://github.com/gxmari007/vite-plugin-eslint/pull/60
          // Copy for ESM types is made in CJS bundle to ensure the declaration file generated in
          // the previous bundle exists.
          { src: 'dist/index.d.ts', dest: 'dist', rename: 'index.d.mts' },
        ],
      }),
    ],
  },
];
