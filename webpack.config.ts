import type { Configuration } from "webpack";
import nodeExternals from "webpack-node-externals";
import process from "process";
import path from "path";
import { fileURLToPath } from "url";
import { merge } from "webpack-merge";
import { EsbuildPlugin } from "esbuild-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const base: Configuration = {
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
        test: /\.m?ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "esbuild-loader",
            options: {
              target: "es2020",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".mts", ".ts", ".js"],
  },
  optimization: {
    minimizer: [
      // webpack 5.110 changed optimization.minimize from `true` to an object, which
      // esbuild-loader <= 4.5.0 blindly passes to esbuild as `minify`. Setting it
      // explicitly here avoids that. Minimizers are skipped entirely when
      // optimization.minimize is false (development mode), so this is safe.
      new EsbuildPlugin({ target: "es2020", minify: true }),
    ],
  },
};

const main = merge(base, {
  name: "background",
  target: "electron-main",
  entry: "./src/background.ts",
  output: {
    filename: "background.js",
    path: path.resolve(__dirname, "app"),
  },
});

const preload = merge(base, {
  name: "bridge",
  target: "electron-preload",
  entry: "./src/bridge.ts",
  output: {
    filename: "bridge.js",
    path: path.resolve(__dirname, "app"),
  },
});

export default [main, preload];
