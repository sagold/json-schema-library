const path = require("path"); // eslint-disable-line
const TerserPlugin = require("terser-webpack-plugin"); // eslint-disable-line
const PRODUCTION = process.env.NODE_ENV === "production";


const config = {
    entry: "./index.ts",
    mode: PRODUCTION ? "production" : "development",
    context: __dirname,
    // target: "web",
    devtool: PRODUCTION ? false : "source-map",
    stats: { children: false },
    output: {
        path: path.resolve(__dirname, PRODUCTION ? "dist" : "dev"),
        filename: 'jsonSchemaLibrary.js',
        libraryTarget: 'umd',
        library: 'jlib',
        umdNamedDefine: true,
        globalObject: `(typeof self !== 'undefined' ? self : this)`
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.resolve(__dirname, "tsconfig.json"),
                        compilerOptions: {
                            sourceMap: !PRODUCTION,
                            declaration: PRODUCTION
                        }
                    }
                }
            }
        ]
    },

    optimization: {
        minimizer: [new TerserPlugin()]
    }
};

module.exports = config;
