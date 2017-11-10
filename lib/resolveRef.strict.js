var gp = require("gson-pointer");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        throw new Error("Schema must not be undefined");
    }

    if (schema.$ref == null) {
        return schema;
    }

    let reference = gp.get(rootSchema, decodeURIComponent(schema.$ref));
    reference = resolveRef(reference, rootSchema); // resolve ref until completely resolved

    if (reference == null) {
        console.log(`Error: Failed resolving reference ${schema.$ref}.`);
    }

    const result = Object.assign({}, reference);
    return result;
};
