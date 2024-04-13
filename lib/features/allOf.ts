/**
 * @draft-04
 */
import { SchemaNode, createNode } from "../schemaNode";
import { JsonSchema, JsonError } from "../types";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";
import { resolveIfSchema } from "./if";
import { shallowCloneSchemaNode } from "../utils/shallowCloneSchema";
import { JsonValidator } from "../validation/type";

/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export function resolveSchema(node: SchemaNode, data: unknown): SchemaNode | JsonError {
    const ifSchema = resolveIfSchema(node, data);
    if (ifSchema) {
        return ifSchema;
    }
    const schema = shallowCloneSchemaNode(node.schema);
    return node.next(omit(schema, "if", "then", "else"));
}

export function resolveAllOf(node: SchemaNode, data: any): SchemaNode | JsonError {
    const { schema } = node;
    let mergedSchema = shallowCloneSchemaNode(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfNode = node.next(schema.allOf[i] as JsonSchema).resolveRef();
        // @todo introduce draft.resolveSchema to iteratively resolve
        const allOfSchema = resolveSchema(allOfNode, data).schema;
        mergedSchema = mergeSchema(mergedSchema, allOfSchema);
    }
    delete mergedSchema.allOf;
    return node.next(mergedSchema);
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
        const subSchemaNode = draft.createNode(subschema).resolveRef();
        resolvedSchema = mergeSchema(resolvedSchema, subSchemaNode.schema);
    });
    return resolvedSchema;
}

/**
 * validate allOf definition for given input data
 */
const validateAllOf: JsonValidator = (node, value) => {
    const { draft, schema } = node;
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors: JsonError[] = [];
    schema.allOf.forEach((subSchema: JsonSchema) => {
        errors.push(...draft.validate(node.next(subSchema), value));
    });
    return errors;
};

export { validateAllOf };
