const path = require('path')
const webpack = require('webpack');

/**
 * @returns {import('webpack').Configuration}
 */
module.exports = (_env, argv) => {
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === 'production' || argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src', 'index.ts'),
    target: "web",
    devtool: "source-map",
    output: {
      filename: 'multichain-sdk.min.js',
      path: path.join(__dirname, 'dist'),
      globalObject: 'this',
      library: {
        type: 'umd',
        name: 'Multichain'
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/u,
          include: path.resolve(__dirname, 'src'),
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.browser.json')
          }
        },
        {
          test: /\.js/u,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.json$/,
          type: 'json'
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.ts'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
      ],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        vm: require.resolve("vm-browserify"),
        "readable-stream": require.resolve('readable-stream'),
        buffer: require.resolve('buffer'),
        // http: require.resolve('stream-http'),
        // https: require.resolve('https-browserify'),
        // url: require.resolve("url/"),
        fs: false,
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProgressPlugin({ profile: false }),
    ],
    optimization: {
      minimize: true,
    },
    stats: {
      errorDetails: true
    }
  }
}
