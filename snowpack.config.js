// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    public: { url: '/', static: true },
    src: { url: '/dist' },
  },
  plugins: [
    '@snowpack/plugin-typescript',
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-postcss',
    '@snowpack/plugin-sass',
  ],
  exclude: ['**/node_modules/**/*', '.idea', '.vscode'],
  routes: [{ match: 'routes', src: '.*', dest: '/index.html' }],
  packageOptions: {},
  devOptions: {},
  buildOptions: {},
};
