// Babel is only required for using Jest with TypeScript. It is not used by the build process.

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
  ],
};
