/* eslint-env node */
const { join } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: 'babel-loader',
            exclude: join(__dirname, 'node_modules'),
        }]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    entry: {
        background: join(__dirname, 'src/background'),
        options: join(__dirname, 'src/options'),
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
    ],
};
