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
    var _a, _b;
    let mergedSchema = {};
    let dynamicId = "";
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            const { node: schemaNode } = node.anyOf[i].reduceSchema(data);
            if (schemaNode) {
                const nestedDynamicId = (_b = (_a = schemaNode.dynamicId) === null || _a === void 0 ? void 0 : _a.replace(node.dynamicId, "")) !== null && _b !== void 0 ? _b : "";
                const localDynamicId = nestedDynamicId === "" ? `anyOf/${i}` : nestedDynamicId;
                dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
                const schema = mergeSchema(node.anyOf[i].schema, schemaNode.schema);
                mergedSchema = mergeSchema(mergedSchema, schema, "anyOf");
            }
        }
    }
    return node.compileSchema(mergedSchema, `${node.spointer}${dynamicId}`, node.schemaId, `${node.schemaId}(${dynamicId})`);
}
function validateAnyOf({ node, data, pointer, path }) {
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            return undefined;
        }
    }
    return node.createError("AnyOfError", { pointer, schema: node.schema, value: data, anyOf: node.schema.anyOf });
}
