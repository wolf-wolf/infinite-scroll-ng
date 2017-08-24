'use strict';

// Modules
var webpack = require('webpack');
var path = require('path');
var configJson = require('./package.json');

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var args = require('yargs').argv;

// parameters
var isProd = args.prod;
var plugins = [];
var entry = ["./src/index.js"];


if (isProd) {
    plugins.push(
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            mangle: true
        }),
        new webpack.optimize.OccurenceOrderPlugin()
    );
} else {
    entry.unshift('webpack-dev-server/client?http://0.0.0.0:8081');
    plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports =  {
    entry: entry,
    plugins: plugins,
    output: {
        path: path.join(__dirname, 'dist'),
        filename: "index.js"
    },
    module: {
        loaders: [
            { 
                test: /\.html$/,
                loader: 'html-loader'
            }, {
                test: /\.scss$/,
                loaders: ["style", "css?localIdentName=c-" + configJson.name + "-[hash:base64:8]", "sass"]
            }, {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015'],
                    plugins: ['transform-runtime']
                }
            }

        ]
    },
    devServer: {
        contentBase: './',
        inline: true,
        hot: true,
        port: 8081
    }
}
