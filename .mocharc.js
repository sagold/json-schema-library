process.env.TS_NODE_PROJECT = "./tsconfig.test.json";
process.env.JLIB_TEST_RUN = "true";

module.exports = {
    "node-option": ["import=tsx"]
};
