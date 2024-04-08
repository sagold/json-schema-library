import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";
import Q from "../Q";
import { resolveIfSchema } from "./if";
/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export function resolveSchema(draft, schemaToResolve, data) {
    const schema = Q.clone(schemaToResolve);
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        return ifSchema;
    }
    return omit(schema, "if", "then", "else");
}
export function resolveAllOf(draft, data, schema = draft.rootSchema) {
    let mergedSchema = Q.clone(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        // @todo introduce draft.resolveSchema to iteratively resolve
        const allOfSchema = resolveSchema(draft, Q.add(schema, draft.resolveRef(schema.allOf[i])), data);
        mergedSchema = mergeSchema(mergedSchema, allOfSchema);
    }
    delete mergedSchema.allOf;
    return mergedSchema;
}
/**
 * @attention: subschemas have to be resolved upfront (e.g. if-else that do not apply)
 * Merge all allOf sub schema into a single schema. Returns undefined for
 * missing allOf definition.
 *
 * @returns json schema defined by allOf or undefined
 */
export function mergeAllOfSchema(draft, schema) {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema = {};
    allOf.forEach((subschema) => {
        resolvedSchema = mergeSchema(resolvedSchema, draft.resolveRef(subschema));
    });
    return resolvedSchema;
}
/**
 * validate allOf definition for given input data
 */
const validateAllOf = (draft, schema, value, pointer) => {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors = [];
    schema.allOf.forEach((subSchema) => {
        errors.push(...draft.validate(value, Q.add(schema, subSchema), pointer));
    });
    return errors;
};
export { validateAllOf };
