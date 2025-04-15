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
    const { schema, evaluationPath } = node;
    if (Array.isArray(schema.allOf) && schema.allOf.length) {
        node.allOf = schema.allOf.map((s, index) => node.compileSchema(s, `${evaluationPath}/allOf/${index}`, `${node.schemaLocation}/allOf/${index}`));
    }
}
function reduceAllOf({ node, data, key, pointer, path }) {
    var _a, _b;
    if (node.allOf == null) {
        return;
    }
    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    let dynamicId = "";
    for (let i = 0; i < node.allOf.length; i += 1) {
        const { node: schemaNode } = node.allOf[i].reduceNode(data, { key, pointer, path });
        if (schemaNode) {
            const nestedDynamicId = (_b = (_a = schemaNode.dynamicId) === null || _a === void 0 ? void 0 : _a.replace(node.dynamicId, "")) !== null && _b !== void 0 ? _b : "";
            const localDynamicId = nestedDynamicId === "" ? `allOf/${i}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;
            const schema = mergeSchema(node.allOf[i].schema, schemaNode.schema);
            mergedSchema = mergeSchema(mergedSchema, schema, "allOf", "contains");
        }
    }
    return node.compileSchema(mergedSchema, `${node.evaluationPath}/${dynamicId}`, node.schemaLocation, `${node.schemaLocation}(${dynamicId})`);
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
