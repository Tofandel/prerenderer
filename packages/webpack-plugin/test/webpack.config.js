const WebpackPrerenderSPAPlugin = require('@prerenderer/webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

module.exports = (context, prerenderConfig, plugins = []) => ({
  mode: 'production',
  context,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'output'),
  },
  entry: './index.js',
  target: 'web',
  module: {
    rules: [
      // ... other rules
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: 'TEST prerender-webpack-plugin',
      template: path.resolve(__dirname, '../examples/public/index.html'),
      filename: 'index.html',
    }),
    new WebpackPrerenderSPAPlugin(prerenderConfig),
    ...plugins,
  ],
})
