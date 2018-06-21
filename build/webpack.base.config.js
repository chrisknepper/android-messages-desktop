const path = require("path");
const nodeExternals = require("webpack-node-externals");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

const translateEnvToMode = (env) => {
  if (env === "production") {
    return "production";
  }
  return "development";
};

module.exports = env => {
  return {
    target: "electron-renderer",
    mode: translateEnvToMode(env),
    node: {
      __dirname: false,
      __filename: false
    },
    externals: [nodeExternals()],
    resolve: {
      alias: {
        env: path.resolve(__dirname, `../config/env_${env}.json`)
      }
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: ["babel-loader"]
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                useRelativePath: process.env.NODE_ENV !== "production",
                emitFile: false,
                name (file) {
                  if (process.env.NODE_ENV !== "production") {
                    return '[name].[ext]'
                  }
                  return '[name].[ext]'
                }
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new FriendlyErrorsWebpackPlugin({ clearConsole: env === "development" })
    ]
  };
};
