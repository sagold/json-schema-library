const copy = require("./utils/copy");
const merge = require("./utils/merge");
const errors = require("./validation/errors");


module.exports = function resolveAllOf(core, schema, data, pointer) {
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        if (core.isValid(schema.allOf[i], data, pointer) === false) {
            return errors.allOfError({ value: data, pointer, allOf: JSON.stringify(schema.allOf) });
        }
        mergedSchema = merge(mergedSchema, schema.allOf[i]);
    }

    delete mergedSchema.allOf;
    return mergedSchema;
};
