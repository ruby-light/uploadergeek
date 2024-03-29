const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const WebpackBar = require("webpackbar");
const CopyPlugin = require("copy-webpack-plugin");

let localCanisters, prodCanisters, canisterConfig;

const REPLICA_LOCAL_PORT = 4943

const canisterNetwork =
    process.env.DFX_NETWORK ||
    (process.env.NODE_ENV === "production" ? "ic" : "local");

function initDFXJson() {
    try {
        return require(path.resolve("dfx.json"));
    } catch (error) {
        console.log("No dfx.json found. Continuing production");
    }
    return undefined;
}
let dfxJson = initDFXJson();
// console.log("dfxJson", dfxJson);

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

    //current asset canisterId
    const currentCanisterId = process.env.CANISTER_ID || process.env.DEFAULT_ASSET_CANISTER_ID
    //current asset canister name in dfx.json
    const currentCanisterNameInDFXJSON = getCurrentCanisterNameInDFXJSON(currentCanisterId);
    if (currentCanisterNameInDFXJSON == undefined || currentCanisterNameInDFXJSON.length == 0) {
        throw new Error(`Canister name with id ${currentCanisterId} not found in canister_ids.json/dfx.json ${JSON.stringify(process.env, null, 4)}\n\n${JSON.stringify({
            currentCanisterId, currentCanisterNameInDFXJSON,
        }, null, 4)}\n\n`)
    }

    //current asset canister entry point folder
    const assetCanisterSourceDirectory = getAssetCanisterEntryPointFolder(currentCanisterNameInDFXJSON, dfxJson);
    if (assetCanisterSourceDirectory == undefined || assetCanisterSourceDirectory.length == 0) {
        throw new Error(`Asset canister source directory for canister with name ${currentCanisterNameInDFXJSON} not found in dfx.json ${JSON.stringify(dfxJson, null, 4)}\n\n${JSON.stringify({
            currentCanisterId, currentCanisterNameInDFXJSON, assetCanisterSourceDirectory,
        }, null, 4)}\n\n`)
    }

    const assetCanisterEntryPointPath = path.join(assetCanisterSourceDirectory, "src", "index.html");
    console.log("assetCanisterEntryPointPath", assetCanisterEntryPointPath);

    const assetCanisterCssDirectoryPath = path.resolve(__dirname, assetCanisterSourceDirectory, "src"/*, "css"*/);
    console.log("assetCanisterCssDirectoryPath", assetCanisterCssDirectoryPath);

    const assetCanisterStaticAssetsDirectoryPath = path.resolve(__dirname, "src", assetCanisterSourceDirectory, "assets")

    const outputPath = path.join(__dirname, "dist", currentCanisterNameInDFXJSON);
    console.log("outputPath", outputPath);

    const lessLoader = {
        loader: "less-loader",
        options: {
            lessOptions: {
                javascriptEnabled: true,
                paths: [
                    path.resolve(__dirname, "node_modules"),
                    assetCanisterCssDirectoryPath,
                ]
            },
        }
    };

    const internetIdentityCanisterId = (canisterConfig["internet_identity"] || {})[canisterNetwork];

    const iiUrl = isDevelopment ? `http://localhost:${REPLICA_LOCAL_PORT}/?canisterId=${internetIdentityCanisterId}` : "https://identity.ic0.app";
    const nfidUrl = `https://nfid.one/authenticate/?applicationName=Identitygeek&applicationLogo=https%3A%2F%2F${currentCanisterId}.raw.ic0.app%2Ffavicon-64.svg#authorize`;

    console.log("Full context", {
        currentCanisterId, currentCanisterNameInDFXJSON, assetCanisterSourceDirectory,
        assetCanisterEntryPointPath, outputPath,
        assetCanisterStaticAssetsDirectoryPath,assetCanisterCssDirectoryPath,
        internetIdentityCanisterId, iiUrl, nfidUrl,
    });

    // throw new Error("STOP")

    const splitChunksAdditionalConfig = isDevelopment ? {
        maxSize: 1024 * 1024,
        minChunks: 1,
        priority: -20,
    } : {}

    return {
        target: "web",
        mode: isDevelopment ? "development" : "production",
        entry: {
            index: path.join(__dirname, assetCanisterEntryPointPath).replace(/\.html$/, ".jsx"),
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
                        ...splitChunksAdditionalConfig
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
                path.resolve(`./${assetCanisterSourceDirectory}`),
            ],
        },
        output: {
            filename: "[name].[contenthash].bundle.js",
            path: outputPath,
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
                template: path.join(__dirname, assetCanisterEntryPointPath),
                cache: false,
            }),
            new webpack.EnvironmentPlugin({
                NODE_ENV: "development",
                II_URL: iiUrl,
                NFID_II_URL: nfidUrl,
                IS_TEST_SERVER: isTestServer,
                TEST_ENV_UI_SERVER: isTestEnvUIServer,
                FRONTEND_CANISTER: currentCanisterId,
                ...canisterEnvVariables,
            }),
            new webpack.ProvidePlugin({
                Buffer: [require.resolve("buffer/"), "Buffer"],
                process: require.resolve("process/browser"),
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: `${assetCanisterSourceDirectory}/src/.ic-assets.json*`,
                        to: ".ic-assets.json5",
                        noErrorOnMissing: true
                    },
                ],
            })
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
            static: assetCanisterStaticAssetsDirectoryPath,
            port: 3007,
            hot: true,
            //host: "0.0.0.0",
            watchFiles: {
                paths: [path.resolve(__dirname, assetCanisterSourceDirectory)],
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

function getCurrentCanisterNameInDFXJSON(canisterId) {
    for (const [nameInDFXJson, value] of Object.entries(canisterConfig)) {
        if (value[canisterNetwork] === canisterId) {
            return nameInDFXJson
        }
    }
}

function getAssetCanisterEntryPointFolder(currentCanisterNameInDFXJSON, dfxJson) {
    try {
        return dfxJson.canisters[currentCanisterNameInDFXJSON].frontend.entrypoint.replace("/src/index.html", "")
    } catch (e) {
    }
    return undefined
}