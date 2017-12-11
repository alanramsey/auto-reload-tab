/* eslint-env node */
const { join } = require('path');

module.exports = {
    entry: {
        background: join(__dirname, 'src/background'),
    },
    output: {
        path: join(__dirname, 'extension'),
        filename: '[name].js',
    },
};
