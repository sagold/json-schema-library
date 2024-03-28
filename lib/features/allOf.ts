/**
 * @draft-04
 */
import { JsonSchema, JsonValidator, JsonError } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";
import copy from "../utils/copy";
import { resolveIfSchema } from "./if";

/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export function resolveSchema(draft: Draft, schemaToResolve: JsonSchema, data: unknown): JsonSchema {
    const schema = { ...(draft.resolveRef(schemaToResolve) ?? {}) };
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        return ifSchema;
    }
    return omit(schema, "if", "then", "else");
}

export function resolveAllOf(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema
): JsonSchema | JsonError {
    let mergedSchema = copy(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        // @todo introduce draft.resolveSchema to iteratively resolve
        const allOfSchema = resolveSchema(draft, schema.allOf[i], data);
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
export function mergeAllOfSchema(draft: Draft, schema: JsonSchema): JsonSchema | undefined {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema: JsonSchema = {};
    allOf.forEach((subschema) => {
        resolvedSchema = mergeSchema(resolvedSchema, draft.resolveRef(subschema));
    });
    return resolvedSchema;
}

/**
 * validate allOf definition for given input data
 */
const validateAllOf: JsonValidator = (draft, schema, value, pointer) => {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors: JsonError[] = [];
    schema.allOf.forEach((subSchema: JsonSchema) => {
        errors.push(...draft.validate(value, subSchema, pointer));
    });
    return errors;
};

export { validateAllOf };
