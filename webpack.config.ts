import { Configuration } from "webpack";
import nodeExternals from "webpack-node-externals";
import HTMLWebpackPlguin from "html-webpack-plugin";
import process from "process";
import path from "path";
import merge from "webpack-merge";

const base: Configuration = {
  target: "electron-renderer",
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  externals: [nodeExternals()],
  devtool: "source-map",
  node: {
    __dirname: false,
    __filename: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
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
    new HTMLWebpackPlguin({
      template: "./src/index.html",
      inject: false,
    }),
  ],
};

const app = merge(base, {
  name: "app",
  entry: {
    background: "./src/background.ts",
    app: "./src/app.ts",
    bridge: "./src/bridge.ts",
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "app"),
  },
});

export default [app];
