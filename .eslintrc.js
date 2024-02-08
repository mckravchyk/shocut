/* eslint-disable @typescript-eslint/no-var-requires */

const typeAwareLinting = require('eslint-config-mckravchyk/type_aware_linting');

module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  rules: {
    // The default rule does not work with enums
    'no-shadow': 'off',
  },
  extends: [
    'mckravchyk/base',
  ],
  overrides: [
    typeAwareLinting({
      ecmaVersion: 11,
      sourceType: 'module',
      __dirname,
      project: ['./tsconfig.json'],
    }),
  ],
};
