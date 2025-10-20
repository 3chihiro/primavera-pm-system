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
  // ブラウザ互換のレンダラーバンドルを出力
  target: 'web',
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
    extensions: ['.tsx', '.ts', '.js', '.mjs', '.json'],
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
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser.js"),
      "util": require.resolve("util"),
      "assert": require.resolve("assert"),
      "events": require.resolve("events"),
      "module": false,
      "child_process": false,
      "net": false,
      "tls": false,
      "os": false,
    },
  },
  output: {
    // Avoid clashing with Electron main bundle (also main.js)
    filename: '[name].renderer.js',
    path: path.resolve(__dirname, 'dist'),
    clean: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(argv.mode || 'development'),
      'global': 'globalThis',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'dist'),
      },
      {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
    ],
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
