import { mergeSchema } from "../utils/mergeSchema";
import { validateNode } from "../validateNode";
export const anyOfKeyword = {
    id: "anyOf",
    keyword: "anyOf",
    parse: parseAnyOf,
    addReduce: (node) => node.anyOf != null,
    reduce: reduceAnyOf,
    addValidate: (node) => node.anyOf != null,
    validate: validateAnyOf
};
export function parseAnyOf(node) {
    const { schema, spointer, schemaId } = node;
    if (Array.isArray(schema.anyOf) && schema.anyOf.length) {
        node.anyOf = schema.anyOf.map((s, index) => node.compileSchema(s, `${spointer}/anyOf/${index}`, `${schemaId}/anyOf/${index}`));
    }
}
function reduceAnyOf({ node, data, pointer, path }) {
    let mergedSchema = {};
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            const { node: schemaNode } = node.anyOf[i].reduceSchema(data);
            if (schemaNode) {
                const schema = mergeSchema(node.anyOf[i].schema, schemaNode.schema);
                mergedSchema = mergeSchema(mergedSchema, schema, "anyOf");
            }
        }
    }
    return node.compileSchema(mergedSchema, `${node.spointer}/anyOf`, node.schemaId);
}
function validateAnyOf({ node, data, pointer, path }) {
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            return undefined;
        }
    }
    return node.createError("AnyOfError", { pointer, schema: node.schema, value: data, anyOf: node.schema.anyOf });
}
