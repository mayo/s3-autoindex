const webpackMerge = require('webpack-merge');
const webpack = require('webpack');

const commonConfig = require('./base.js')();

module.exports = function(env) {
  return webpackMerge(commonConfig, {

    devtool: 'cheap-module-source-map',

    plugins: [
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false
      }),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify('production')
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        sourceMap: true,
        mangle: {
          screw_ie8: true,
        },
        compress: {
          screw_ie8: true
        },
        comments: false
      })
    ]

  })
}
