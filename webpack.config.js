/* eslint-env node */
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: 'babel-loader',
            exclude: join(__dirname, 'node_modules'),
        }, {
            test: /\.css$/,
            use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: 'css-loader',
            }),
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    entry: {
        background: join(__dirname, 'src/background'),
        options: join(__dirname, 'src/options'),
        popup: join(__dirname, 'src/popup'),
        content: join(__dirname, 'src/content'),
    },
    output: {
        path: join(__dirname, 'extension'),
        filename: '[name].js',
    },
    devtool: 'source-map',
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'options.html',
            chunks: ['options'],
            title: 'Options',
        }),
        new HtmlWebpackPlugin({
            filename: 'popup.html',
            chunks: ['popup'],
            title: 'Auto Reload Tab',
        }),
        new ExtractTextPlugin('[name].css'),
    ],
};
