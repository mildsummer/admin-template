const webpack = require('webpack');
const path = require('path');
const RemoveSourceMapUrlWebpackPlugin = require('./remove-source-map-url-webpack-plugin.js');
const LicenseInfoWebpackPlugin = require('license-info-webpack-plugin').default;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const PROD = argv.mode === 'production';
  const printedCommentRegExp = /webpackChunkName/;
  return {
    mode: PROD ? 'production' : 'development',
    entry: {
      app: './src/javascripts/entry.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist/assets'),
      publicPath: '/assets/',
      filename: '[name].js',
      sourceMapFilename: '[name].js.map',
      globalObject: 'this'
    },
    devServer: {
      contentBase: './dist',
      hot: true
    },
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'eslint-loader' }
          ]
        },
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              shouldPrintComment: PROD ? (value) => (value.match(printedCommentRegExp)) : () => (true),
              plugins: PROD ? [[
                'transform-react-remove-prop-types',
                {
                  removeImport: true
                }
              ]] : null,
              compact: true
            }
          }]
        },
        {
          enforce: 'pre',
          test: /\.(sass|scss|css)$/,
          use: 'import-glob-loader'
        },
        {
          test: /\.(sass|scss|css)$/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: (loader) => PROD ? [
                  PROD ? require('cssnano')({
                    preset: 'default'
                  }) : null,
                  require('iconfont-webpack-plugin')({
                    resolve: loader.resolve
                  }),
                  require('autoprefixer')({ grid: true })
                ] : [
                  require('iconfont-webpack-plugin')({
                    resolve: loader.resolve
                  }),
                  require('autoprefixer')({ grid: true })
                ]
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !PROD
              }
            }
          ]
        },
        {
          test: /\.(gif|png|jpg|eot|wof|woff|woff2|ttf|svg)$/,
          loader: 'url-loader',
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx', '.sass', '.scss', '.css']
    },
    optimization: PROD ? {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            output: {
              comments: /author:|url:/
            }
          }
        })
      ]
    } : {},
    plugins: PROD ? [
      new Dotenv({
        path: path.resolve(__dirname, './.env')
      }),
      new RemoveSourceMapUrlWebpackPlugin({}),
      new LicenseInfoWebpackPlugin({
        glob: '{LICENSE,license,License}*',
        includeLicenseFile: false
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"'
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.ProgressPlugin((percentage, msg) => {
        process.stdout.write('progress ' + Math.floor(percentage * 100) + '% ' + msg + '\r');
      })
    ] : [
      new Dotenv({
        path: path.resolve(__dirname, './.env')
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"development"'
      }),
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ]
  };
};
