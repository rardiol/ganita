const path = require('path');
const { PyodidePlugin } = require("@pyodide/webpack-plugin");

module.exports = {
    entry: {
        index: './src/index.ts',
    },
    devtool: 'inline-source-map',
    plugins: [new PyodidePlugin()],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
