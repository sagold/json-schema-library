import { mergeSchema } from "../mergeSchema";
import { omit } from "../utils/omit";
import { resolveIfSchema } from "./if";
import { shallowCloneSchemaNode } from "../utils/shallowCloneSchema";
/**
 * resolves schema
 * when complete this will have much duplication to step.object etc
 */
export function resolveSchema(node, data) {
    const ifSchema = resolveIfSchema(node, data);
    if (ifSchema) {
        return ifSchema;
    }
    const schema = shallowCloneSchemaNode(node.schema);
    return node.next(omit(schema, "if", "then", "else"));
}
export function resolveAllOf(node, data) {
    const { schema } = node;
    let mergedSchema = shallowCloneSchemaNode(schema);
    for (let i = 0; i < schema.allOf.length; i += 1) {
        const allOfNode = node.next(schema.allOf[i]).resolveRef();
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
export function mergeAllOfSchema(draft, schema) {
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    let resolvedSchema = {};
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
const validateAllOf = (node, value) => {
    const { draft, schema } = node;
    const { allOf } = schema;
    if (!Array.isArray(allOf) || allOf.length === 0) {
        return;
    }
    const errors = [];
    schema.allOf.forEach((subSchema) => {
        errors.push(...draft.validate(node.next(subSchema), value));
    });
    return errors;
};
export { validateAllOf };
