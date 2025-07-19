const path = require('path');
const { PyodidePlugin } = require("@pyodide/webpack-plugin");
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    plugins: [
        new PyodidePlugin(),
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 1024 * 1024 * 20,
        }),
    ],
    devServer: {
        static: './dist',
        hot: false,
        devMiddleware: {
            writeToDisk: true,
        },
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
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico|whl)$/i,
                type: 'asset/resource',
                generator: {
                    filename: "[name][ext]",
                },
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        assetModuleFilename: "[name][ext]",
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
