/**
 * @draft-04
 */
import { JsonSchema, JsonValidator, JsonError, SchemaNode, createNode } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";
import { resolveIfSchema } from "./if";
import { shallowCloneSchemaNode } from "../utils/shallowCloneSchema";

/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export function resolveSchema(node: SchemaNode, data: unknown): SchemaNode | JsonError {
    const schema = shallowCloneSchemaNode(node.schema);
    const ifSchema = resolveIfSchema(node, data);
    if (ifSchema) {
        return ifSchema;
    }
    return node.next(omit(schema, "if", "then", "else"));
}

export function resolveAllOf(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema
): JsonSchema | JsonError {
    let mergedSchema = shallowCloneSchemaNode(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfNode = draft.resolveRef(createNode(draft, schema.allOf[i]));
        // @todo introduce draft.resolveSchema to iteratively resolve
        const allOfSchema = resolveSchema(allOfNode, data).schema;

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
        if (subschema == null) {
            return;
        }
        const subSchemaNode = draft.resolveRef(createNode(draft, subschema));
        resolvedSchema = mergeSchema(resolvedSchema, subSchemaNode.schema);
    });
    return resolvedSchema;
}

/**
 * validate allOf definition for given input data
 */
const validateAllOf: JsonValidator = (node, value) => {
    const { draft, schema, pointer } = node;
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
