const remotes = require("../remotes");
const precompile = require("./precompileSchema");


module.exports = function addSchema(url, schema) {
    schema.id = schema.id || url;
    remotes[url] = precompile(schema);
};
