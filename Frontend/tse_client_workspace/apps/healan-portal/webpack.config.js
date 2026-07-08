const reactWebpackConfig = require('@nrwl/react/plugins/webpack');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = (config) => {
  config = reactWebpackConfig(config);

  if (config.mode === 'development') {
    config.plugins = config.plugins.filter((plugin) => !(plugin instanceof ReactRefreshPlugin));
    config.plugins.push(new ReactRefreshPlugin({ overlay: false }));
  }

  return config;
};
