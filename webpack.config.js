var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, "autoindex.js"),

  module: {
    rules: [{
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        use: 'css-loader'
      })
    }],
  },

  devtool: 'sourcemap',

  devServer: {
    contentBase: path.join(__dirname, "dist"),
    port: 9000
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      filename: 'index.html',
      inject: 'body',

      inlineSource: '.(js|css)$', // embed all javascript and css inline

      minify: {
        collapseWhitespace: true,
      },
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new ExtractTextPlugin('styles.css')
  ],
};

