/**
 * resolveAllOf is tricky:
 *
 * resolve all merges all schemas altough each schema in the list must be used
 * for validation. But to use this as a template schema to create data and a
 * resolved schema, structural data must be merged. Currently, it is merged in
 * all case, but separately validated and resolved. This will break at some
 * point, requiring us to be more specific on our current intent (validation
 * vs get (resolved) schema)
 */
import copy from "./utils/copy";
import { mergeArraysUnique } from "./utils/merge";
import { resolveIfSchema } from "./features/if";
/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
function resolveSchema(draft, schemaToResolve, data) {
    var _a;
    const schema = { ...((_a = draft.resolveRef(schemaToResolve)) !== null && _a !== void 0 ? _a : {}) };
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        return ifSchema;
    }
    delete schema.if;
    delete schema.then;
    delete schema.else;
    return schema;
}
export default function resolveAllOf(draft, data, schema = draft.rootSchema) {
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfSchema = resolveSchema(draft, schema.allOf[i], data);
        mergedSchema = mergeArraysUnique(mergedSchema, allOfSchema);
        data = draft.getTemplate(data, mergedSchema);
    }
    delete mergedSchema.allOf;
    return mergedSchema;
}
