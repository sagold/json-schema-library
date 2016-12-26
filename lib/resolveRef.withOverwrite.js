var gp = require("gson-pointer");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        throw new Error("Schema must not be undefined");
    }

    if (schema.$ref == null) {
        return schema;
    }

    const reference = gp.get(rootSchema, schema.$ref);
    // @todo use this for form. in draft04 any value in schema MUST be ignored
    const result = Object.assign({}, reference, schema);
    delete result.$ref;
    return result;
};
