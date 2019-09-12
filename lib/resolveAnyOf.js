const copy = require("./utils/copy");
const merge = require("./utils/merge");
const errors = require("./validation/errors");


module.exports = function resolveAnyOf(core, schema, data, pointer) {
    let found = false;
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        if (core.isValid(schema.anyOf[i], data, pointer)) {
            found = true;
            mergedSchema = merge(mergedSchema, schema.anyOf[i]);
        }
    }

    if (found === false) {
        return errors.anyOfError({ value: data, pointer, anyOf: JSON.stringify(schema.anyOf) });
    }

    delete mergedSchema.anyOf;
    return mergedSchema;
};
