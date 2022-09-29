import copy from "./utils/copy";
import merge from "./utils/merge";
import errors from "./validation/errors";
import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";

export default function resolveAnyOf(
    core: Core,
    data: any,
    schema: JSONSchema = core.rootSchema,
    pointer: JSONPointer = "#"
): JSONSchema | JSONError {
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
