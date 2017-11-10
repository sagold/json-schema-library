const remotes = require("../../remotes");

// resolves remote references and returns either the input schema or the referenced remote schema
module.exports = function getTargetSchema(ref, schema) {
    if (ref.indexOf("#") > 0) {
        const request = ref.split("#");
        ref = request[1];
        if (remotes[request[0]] == null) {
            throw new Error(`Unknown remote schema ${request[0]}. It should have been added to 'remotes'-module`);
        }
        // resolve remote references locally
        return remotes[request[0]];
    }
    return schema;
};
