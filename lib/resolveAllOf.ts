import copy from "./utils/copy";
import merge from "./utils/merge";
import errors from "./validation/errors";
import { JSONSchema, JSONPointer, JSONError } from "./types";
import { Draft as Core } from "./draft";

export default function resolveAllOf(
    core: Core,
    data: any,
    schema: JSONSchema = core.rootSchema,
    pointer: JSONPointer = "#"
): JSONSchema | JSONError {
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfSchema = core.resolveRef(schema.allOf[i]);
        // if (core.isValid(data, allOfSchema, pointer) === false) {
        //     return errors.allOfError({ value: data, pointer, allOf: JSON.stringify(schema.allOf) });
        // }
        mergedSchema = merge(mergedSchema, allOfSchema);
    }

    delete mergedSchema.allOf;
    return mergedSchema;
}
