/* global module: true, require: true */

module.exports = config => {
  // do stuff with the webpack config...
  config.resolve.fallback = config.resolve.fallback ?? {};
  Object.assign(config.resolve.fallback, {
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    'react/jsx-runtime': 'react/jsx-runtime.js',
    'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js'
  });
  return config;
};
