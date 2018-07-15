const path = require("path");
const merge = require("webpack-merge");
const base = require("./webpack.base.config");

module.exports = env => {
  return merge(base(env), {
    entry: {
      background: "./src/background.js",
      app: "./src/app.js",
      bridge: "./src/helpers/webview/bridge.js"
    },
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "../app")
    }
  });
};
