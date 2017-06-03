var gp = require("gson-pointer");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema == null) {
        throw new Error("Schema must not be undefined");
    }

    if (rootSchema == null) {
        throw new Error("Missing rootschema for", schema);
    }

    if (schema.$ref == null) {
        return schema;
    }

    const reference = gp.get(rootSchema, schema.$ref);
    // @todo use this for forms. in draft04 any value in schema MUST be ignored
    const result = Object.assign({}, reference, schema);
    delete result.$ref;

    return result;
};
