const gp = require("gson-pointer");
const remotes = require("../remotes");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        return {};
    }

    if (schema.$ref == null) {
        return schema;
    }

    let target = schema.$ref;
    let targetSchema = rootSchema;

    if (target.indexOf("#") > 0) {
        // resolve remote references locally
        const request = schema.$ref.split("#");
        target = request[1];
        if (remotes[request[0]] == null) {
            throw new Error(`Unknown remote schema ${request[0]}. It should have been added to 'remotes'-module`);
        }
        targetSchema = remotes[request[0]];
    }

    let reference = gp.get(targetSchema, decodeURIComponent(target));
    reference = resolveRef(reference, targetSchema); // resolve ref until completely resolved

    if (reference == null) {
        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
    }

    const result = Object.assign({}, reference);
    return result;
};
