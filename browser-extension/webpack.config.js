const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

module.exports = {
    entry: {
        popup: './src/popup/index.tsx',
        content: './src/content/content.ts',
        background: './src/background/background.ts',
        welcome: './src/welcome/welcome.ts',
        'auth-callback': './src/auth/auth-callback-index.tsx'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        // Define environment variables for the app
        new webpack.DefinePlugin({
            'process.env.REACT_APP_BACKEND_URL': JSON.stringify(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'),
            'process.env.REACT_APP_AUTH_URL': JSON.stringify(process.env.REACT_APP_AUTH_URL || 'http://localhost:3000'),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            '__API_URL__': JSON.stringify(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000')
        }),
        new HtmlWebpackPlugin({
            template: './src/popup/popup.html',
            filename: 'popup.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
            template: './src/welcome/welcome.html',
            filename: 'welcome.html',
            chunks: ['welcome']
        }),
        new HtmlWebpackPlugin({
            template: './src/auth/auth-callback.html',
            filename: 'auth-callback.html',
            chunks: ['auth-callback']
        }),
        new CopyPlugin({
            patterns: [
                { from: 'public/manifest.json', to: 'manifest.json' },
                { from: 'public/icons', to: 'icons', noErrorOnMissing: true },
                { from: 'src/content/content.css', to: 'content.css' },
                { from: 'src/welcome/welcome.css', to: 'welcome.css' }
            ]
        })
    ]
};
