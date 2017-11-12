const path = require("path");
const PRODUCTION = process.env.NODE_ENV === "production";


const webpackConfig = {

    entry: [
        path.join(__dirname, "index.js")
    ],

    output: {
        filename: "jlib.es6.js",
        library: ["jlib"],
        path: path.resolve(__dirname, PRODUCTION ? "dist" : "build")
    },

    context: __dirname,
    target: "web",
    devtool: PRODUCTION ? false : "source-map",

    externals: {},

    resolve: {
        modules: [".", "node_modules"],
        alias: {}
    },

    module: {
        rules: [
        ]
    }
};


module.exports = webpackConfig;
