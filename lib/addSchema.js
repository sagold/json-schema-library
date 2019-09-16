const remotes = require("../remotes");
const compileSchema = require("./compileSchema");


module.exports = function addSchema(url, schema) {
    schema.id = schema.id || url;
    remotes[url] = compileSchema(schema);
};
