var path = require('path');
var webpack = require('webpack');

var config = {
     entry: './src/router.js',
     output: {
         path: __dirname,
         filename: 'HashRouter.js',
         library: ['HashRouter'],
     },
     module: {
         loaders: [{
             test: /.js?$/,
             loader: 'babel-loader',
             exclude: /node_modules/,
             query: {
                 presets: ['es2015']
             }    
         }]
    }
};

module.exports = config;
