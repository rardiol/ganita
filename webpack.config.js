const path = require('path');
const { PyodidePlugin } = require("@pyodide/webpack-plugin");

module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    plugins: [new PyodidePlugin()],
    devServer: {
        static: './dist',
        hot: false,
    },
    module: {
        rules: [
            {
                test: /\.py/,
                type: 'asset/source',
                generator: {
                    emit: false,
                },
            },
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
