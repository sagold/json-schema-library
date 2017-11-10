const remotes = require("../remotes");

module.exports = function addSchema(url, schema) {
    remotes[url] = schema;
};


