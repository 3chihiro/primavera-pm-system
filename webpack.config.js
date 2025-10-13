const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
  mode: argv.mode || 'development',
  entry: {
    main: './src/renderer/index.tsx'
  },
  target: 'electron-renderer',
  devtool: isProduction ? false : 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              noEmit: false,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/database': path.resolve(__dirname, 'src/database'),
    },
    fallback: {
      "fs": false,
      "path": require.resolve("path-browserify"),
      "crypto": false,
      "events": require.resolve("events"),
      "util": require.resolve("util"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser.js"),
      "module": false,
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      global: 'globalThis',
    }),
    new webpack.ProvidePlugin({
      EventEmitter: ['events', 'EventEmitter'],
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js',
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    hot: false,
    liveReload: false,
    webSocketServer: false,
    historyApiFallback: true,
    client: {
      overlay: false,
      webSocketTransport: 'sockjs',
      webSocketURL: 'auto://0.0.0.0:0/ws',
    },
  },
  };
};