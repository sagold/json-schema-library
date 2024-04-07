import { JsonSchema } from "./types";
import { mergeSchema } from "./mergeSchema";

function resolveRecursiveRef(rootSchema: JsonSchema, schema: JsonSchema) {
    const history = schema.__scope.history;
    // for (let i = 0; i < history.length; i += 1) {
    //     console.log(i, history[i], history[i].__scope);
    // }

    // find anchor
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].$recursiveAnchor === true) {
            return history[i];
        }
        // if (history[i].$recursiveAnchor === false) {
        //     return rootSchema;
        // }
        if (history[i].$id) {
            return history[i];
        }
        // if (history[i].$id && /^https?:\/\//.test(history[i].$id)) {
        //     // new root
        //     return history[i];
        // }
        if (history[i].$recursiveAnchor === false) {
            break;
        }
    }
    return rootSchema;
}

/**
 * @todo update types
 * Note: JsonSchema my be false
 */
export default function resolveRefMerge(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
    if (schema == null) {
        return schema;
    }
    if (schema.$recursiveRef) {
        return resolveRecursiveRef(rootSchema, schema);
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
