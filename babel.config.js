module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      "babel-preset-expo",
      ["@babel/preset-env", { targets: { node: "current" } }],
      "@babel/preset-typescript",
    ],
    plugins: [
      "@babel/plugin-transform-flow-strip-types",
      "@babel/plugin-transform-private-methods",
      "@babel/plugin-transform-class-properties",
      "react-native-reanimated/plugin",
    ],
  };
};
