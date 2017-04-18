const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const _basedir = path.join(__dirname, '..');

//ideally this would move to autoindex.js
const octicons = require('octicons');

module.exports = function() {
  return {
    entry: path.join(_basedir, "autoindex.js"),

    module: {
      rules: [{
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          use: 'css-loader'
        })
      }],
    },

    devtool: 'cheap-module-eval-source-map',


    output: {
      path: path.resolve(_basedir, 'dist'),
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

        icons: [
          octicons['chevron-down'],
          octicons['chevron-up'],
          octicons['file-directory'],
          octicons['file-submodule'],
          octicons['file'],
        ],
      }),
      new HtmlWebpackInlineSourcePlugin(),
      new ExtractTextPlugin('styles.css')
    ],
  };
};
