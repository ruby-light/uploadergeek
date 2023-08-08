const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const WebpackBar = require("webpackbar");
let localCanisters, prodCanisters, canisterConfig;

const REPLICA_LOCAL_PORT = 4943

const canisterNetwork =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

function initCanisterEnv() {
    try {
        localCanisters = require(path.resolve(
            ".dfx",
            "local",
            "canister_ids.json"
        ));
    } catch (error) {
        console.log("No local canister_ids.json found. Continuing production");
    }
    try {
        prodCanisters = require(path.resolve("canister_ids.json"));
    } catch (error) {
        console.log("No production canister_ids.json found. Continuing with local");
    }

    canisterConfig = canisterNetwork === "local" ? localCanisters : prodCanisters;

    return Object.entries(canisterConfig).reduce((prev, current) => {
        const [canisterName, canisterDetails] = current;
        prev[canisterName.toUpperCase() + "_CANISTER_ID"] =
            canisterDetails[canisterNetwork];
        return prev;
    }, {});
}

const canisterEnvVariables = initCanisterEnv();
Object.keys(canisterEnvVariables).forEach((key) => {
    if (canisterEnvVariables[key] === undefined) {
        canisterEnvVariables[key] = "";
    }
})

console.log("canisterEnvVariables", canisterEnvVariables)
console.log("canisterNetwork: ", canisterNetwork);
console.log("canisters: ", {localCanisters, prodCanisters, canisterConfig});

const isDevelopment = process.env.NODE_ENV !== "production";
console.log("isDevelopment: ", {isDevelopment});

module.exports = (env) => {
    const isTestServer = process.env.TEST_UI_SERVER === 'true'
    console.log("isTestServer from ENV", isTestServer);
    const isTestEnvUIServer = process.env.TEST_ENV_UI_SERVER === 'true'
    console.log("isTestEnvUIServer from ENV", isTestEnvUIServer);

    const frontendDirectory = "frontend";
    const pathResolveCanisterFolder = `./${frontendDirectory}`;
    const frontendDirectoryPath = path.join(frontendDirectory);

    const frontend_entry = path.join(frontendDirectoryPath, "src", "index.html");
    console.log("frontend_entry", frontend_entry);

    const lessLoader = {
        loader: "less-loader",
        options: {
            lessOptions: {
                javascriptEnabled: true,
                paths: [
                    path.resolve(__dirname, "node_modules"),
                    path.resolve(__dirname, frontendDirectoryPath, "src", "css"),
                ]
            },
        }
    };

    const mainnetAssetCanisterId = isTestServer ?
        isTestEnvUIServer ?
            canisterConfig["frontend_test"][canisterNetwork] //TEST ENV
            :
            canisterConfig["frontend_prod_debug"][canisterNetwork] //PROD ENV DEBUG
        :
        canisterConfig["frontend_prod"][canisterNetwork] //PROD ENV
    console.log("mainnetAssetCanisterId", mainnetAssetCanisterId);

    const internetIdentityCanisterId = (canisterConfig["internet_identity"] || {})[canisterNetwork];

    const iiUrl = isDevelopment ? `http://localhost:${REPLICA_LOCAL_PORT}/?canisterId=${internetIdentityCanisterId}` : "https://identity.ic0.app";
    console.log("iiUrl", {iiUrl});

    return {
        target: "web",
        mode: isDevelopment ? "development" : "production",
        entry: {
            index: path.join(__dirname, frontend_entry).replace(/\.html$/, ".jsx"),
        },
        devtool: isDevelopment ? "source-map" : false,
        optimization: {
            minimize: !isDevelopment,
            minimizer: [
                new TerserPlugin(),
                new CssMinimizerPlugin()
            ],
            splitChunks: {
                // chunks: 'all',
                cacheGroups: {
                    vendor: {
                        name: "node_vendors",
                        test: /[\\/]node_modules[\\/]/,
                        chunks: "all",
                    }
                },
            }
        },
        resolve: {
            extensions: [".js", ".ts", ".jsx", ".tsx"],
            fallback: {
                assert: require.resolve("assert/"),
                buffer: require.resolve("buffer/"),
                events: require.resolve("events/"),
                stream: require.resolve("stream-browserify/"),
                util: require.resolve("util/"),
            },
            modules: [
                path.resolve('./node_modules'),
                path.resolve(pathResolveCanisterFolder),
            ],
        },
        output: {
            filename: "[name].[contenthash].bundle.js",
            path: path.join(__dirname, "dist", frontendDirectory),
            publicPath: "/",
        },
        module: {
            rules: [
                {test: /\.(ts|tsx|jsx)$/, loader: "ts-loader"},
                {test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader']},
                {
                    test: /\.(png|svg|jpg|jpeg)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 6 * 1024,
                        },
                    },
                },
                {
                    test: /\.theme\.(less|css)$/i,
                    use: [
                        {
                            loader: 'style-loader',
                            options: {injectType: 'lazyStyleTag'}
                        },
                        'css-loader',
                        lessLoader
                    ]
                },
                {
                    test: /\.less$/i,
                    exclude: /\.theme\.(less|css)$/i,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        lessLoader
                    ]
                }
            ]
        },
        plugins: [
            new WebpackBar({profile: true}),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css',
                chunkFilename: '[id].[contenthash].css',
            }),
            new HtmlWebpackPlugin({
                template: path.join(__dirname, frontend_entry),
                cache: false,
            }),
            new webpack.EnvironmentPlugin({
                NODE_ENV: "development",
                II_URL: iiUrl,
                NFID_II_URL: `https://nfid.one/authenticate/?applicationName=Identitygeek&applicationLogo=https%3A%2F%2F${mainnetAssetCanisterId}.raw.ic0.app%2Ffavicon-64.svg#authorize`,
                IS_TEST_SERVER: isTestServer,
                TEST_ENV_UI_SERVER: isTestEnvUIServer,
                FRONTEND_CANISTER: mainnetAssetCanisterId,
                ...canisterEnvVariables,
            }),
            new webpack.ProvidePlugin({
                Buffer: [require.resolve("buffer/"), "Buffer"],
                process: require.resolve("process/browser"),
            }),
        ],
        // proxy /api to port REPLICA_LOCAL_PORT during development
        devServer: {
            proxy: {
                "/api": {
                    target: `http://localhost:${REPLICA_LOCAL_PORT}`,
                    changeOrigin: true,
                    pathRewrite: {
                        "^/api": "/api",
                    },
                },
            },
            static: path.resolve(__dirname, "src", frontendDirectory, "assets"),
            port: 3007,
            hot: true,
            //host: "0.0.0.0",
            watchFiles: {
                paths: [path.resolve(__dirname, frontendDirectoryPath)],
                options: {
                    ignored: ["**/*.DS_Store"]
                }
            },
            // watchFiles: [path.resolve(__dirname, frontendDirectoryPath)],
            liveReload: true,
            historyApiFallback: true,
        },
    };
}