import { mergeSchema } from "../utils/mergeSchema";
import { validateNode } from "../validateNode";
export const allOfKeyword = {
    id: "allOf",
    keyword: "allOf",
    parse: parseAllOf,
    addReduce: (node) => node.allOf != null,
    reduce: reduceAllOf,
    addValidate: (node) => node.allOf != null,
    validate: validateAllOf
};
export function parseAllOf(node) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        node.allOf = schema.allOf.map((s, index) => node.compileSchema(s, `${spointer}/allOf/${index}`, `${node.schemaId}/allOf/${index}`));
    }
}
function reduceAllOf({ node, data }) {
    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    for (let i = 0; i < node.allOf.length; i += 1) {
        const { node: schemaNode } = node.allOf[i].reduceSchema(data);
        if (schemaNode) {
            const schema = mergeSchema(node.allOf[i].schema, schemaNode.schema);
            mergedSchema = mergeSchema(mergedSchema, schema, "allOf", "contains");
        }
    }
    return node.compileSchema(mergedSchema, `${node.spointer}/allOf`, node.schemaId);
}
function validateAllOf({ node, data, pointer, path }) {
    if (!Array.isArray(node.allOf) || node.allOf.length === 0) {
        return;
    }
    const errors = [];
    node.allOf.forEach((allOfNode) => {
        errors.push(...validateNode(allOfNode, data, pointer, path));
    });
    return errors;
}
