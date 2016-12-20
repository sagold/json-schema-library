var jp = require("gson-pointer");


module.exports = function resolveRef(schema, rootSchema) {
    if (schema.$ref == null) {
        return schema;
    }

    const reference = jp.get(rootSchema, schema.$ref);
    const result = Object.assign({}, reference, schema);
    delete result.$ref;
    return result;
};
