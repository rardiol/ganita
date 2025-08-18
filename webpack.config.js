const path = require('path');
const WorkboxPlugin = require('workbox-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    plugins: [
        new WorkboxPlugin.GenerateSW({
            // these options encourage the ServiceWorkers to get in there fast
            // and not allow any straggling "old" SWs to hang around
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 1024 * 1024 * 20,
        }),
        new HtmlWebpackPlugin({
            title: 'GANITA',
            favicon: './favicon.ico',
            template: './src/index.html',
        }),
        new MiniCssExtractPlugin()
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
                test: /\.html$/i,
                loader: "html-loader",
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
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
