import copy from "./utils/copy";
import merge from "./utils/merge";
export default function resolveAllOf(core, data, schema = core.rootSchema, pointer = "#") {
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
