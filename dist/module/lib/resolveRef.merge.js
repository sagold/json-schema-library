import { mergeSchema } from "./mergeSchema";
// 1. https://json-schema.org/draft/2019-09/json-schema-core#scopes
function resolveRecursiveRef(rootSchema, schema) {
    const history = schema.__scope.history;
    // console.log("» history", history.map((v: JsonSchema) => v.__scope.pointer));
    // console.log("»» history", history.map((v: JsonSchema) => v));
    // RESTRICT BY CHANGE IN BASE-URL
    let startIndex = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].$id && /^https?:\/\//.test(history[i].$id)) {
            startIndex = i;
            break;
        }
    }
    // FROM THERE FIND FIRST OCCURENCE OF ANCHOR
    const firstAnchor = history.find((s, index) => index >= startIndex && s.$recursiveAnchor === true);
    if (firstAnchor) {
        return firstAnchor;
    }
    // THEN RETURN LATEST BASE AS TARGET
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].$id) {
            return history[i];
        }
    }
    // OR RETURN ROOT
    return rootSchema;
}
/**
 * @todo update types
 * Note: JsonSchema my be false
 */
export default function resolveRefMerge(schema, rootSchema) {
    if (schema == null) {
        return schema;
    }
    if (schema.$recursiveRef) {
        const nextSchema = resolveRecursiveRef(rootSchema, schema);
        return resolveRefMerge(nextSchema, rootSchema);
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
