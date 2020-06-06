/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const merge = require("webpack-merge");
const base = require("./webpack.base.config");

module.exports = merge(base(), {
  entry: {
    background: "./src/background.ts",
    app: "./src/app.ts",
    bridge: "./src/helpers/webview/bridge.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "../app"),
  },
});
