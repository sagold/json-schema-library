import { isSchemaNode, SchemaNode } from "./schemaNode";
import { resolveDynamicSchema } from "./resolveDynamicSchema";

const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];

/**
 * reduces json schema by merging dynamic constructs like if-then-else,
 * dependencies, allOf, anyOf, oneOf, etc into a static json schema
 * omitting those properties.
 *
 * @returns input schema reduced by dynamic schema definitions for the given
 * input data
 */
export function reduceSchema(node: SchemaNode, data: unknown) {
    const resolvedSchema = resolveDynamicSchema(node, data);
    if (isSchemaNode(resolvedSchema)) {
        return node.merge(resolvedSchema.schema, ...toOmit);
    }
    if (resolvedSchema) {
        return resolvedSchema; // error
    }
    return node;
}
