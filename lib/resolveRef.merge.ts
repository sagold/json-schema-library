import { JsonSchema } from "./types";
import { mergeSchema } from "./mergeSchema";

/**
 * @todo update types
 * Note: JsonSchema my be false
 */
export default function resolveRefMerge(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
    if (schema == null) {
        return schema;
    }
    if (schema.$ref == null) {
        return schema;
    }
    const resolvedSchema = rootSchema.getRef(schema);
    if (resolvedSchema === false) {
        return resolvedSchema;
    }
    // @draft >= 2019-09 we now merge schemas: in draft <= 7 $ref is treated as reference, not as schema
    const mergedSchema = mergeSchema(schema, resolvedSchema);
    delete mergedSchema.$ref;

    return mergedSchema;
}
