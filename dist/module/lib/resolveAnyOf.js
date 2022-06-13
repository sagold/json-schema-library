import copy from "./utils/copy";
import merge from "./utils/merge";
import errors from "./validation/errors";
export default function resolveAnyOf(core, data, schema = core.rootSchema, pointer = "#") {
    let found = false;
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.anyOf.length; i += 1) {
        const anyOfSchema = core.resolveRef(schema.anyOf[i]);
        if (core.isValid(data, schema.anyOf[i], pointer)) {
            found = true;
            mergedSchema = merge(mergedSchema, anyOfSchema);
        }
    }
    if (found === false) {
        return errors.anyOfError({ value: data, pointer, anyOf: JSON.stringify(schema.anyOf) });
    }
    delete mergedSchema.anyOf;
    return mergedSchema;
}
