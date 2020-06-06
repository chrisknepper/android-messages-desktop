/* eslint-disable @typescript-eslint/no-var-requires */
const nodeExternals = require("webpack-node-externals");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = (env) => {
  return {
    target: "electron-renderer",
    node: {
      __dirname: false,
      __filename: false,
    },
    externals: [nodeExternals()],
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: ["babel-loader", "ts-loader"],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js", ".css"],
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({
        clearConsole: process.env.NODE_ENV === "development",
      }),
    ],
  };
};
