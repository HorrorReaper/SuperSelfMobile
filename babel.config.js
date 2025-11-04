module.exports = function (api) {
  api.cache(true);
  return {
    // `nativewind/babel` provides configuration that is safer to include
    // as a preset so it doesn't get treated as a plugin object by Babel.
    // Putting it in `presets` prevents the ".plugins is not a valid Plugin property"
    // error which can occur if a preset-like object is placed in `plugins`.
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  };
};
