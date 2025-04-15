import { mergeSchema } from "../utils/mergeSchema";
import { validateNode } from "../validateNode";
export const ifKeyword = {
    id: "if-then-else",
    keyword: "if",
    parse: parseIfThenElse,
    addReduce: (node) => node.if && (node.then != null || node.else != null),
    reduce: reduceIf,
    addValidate: (node) => node.if != null,
    validate: validateIfThenElse
};
export function parseIfThenElse(node) {
    const { schema, evaluationPath } = node;
    if (schema.if != null) {
        node.if = node.compileSchema(schema.if, `${evaluationPath}/if`);
    }
    if (schema.then != null) {
        node.then = node.compileSchema(schema.then, `${evaluationPath}/then`);
    }
    if (schema.else != null) {
        node.else = node.compileSchema(schema.else, `${evaluationPath}/else`);
    }
}
function reduceIf({ node, data, pointer, path }) {
    var _a, _b, _c, _d;
    // @todo issue with mergeNode (node.if == null)
    if (data === undefined || node.if == null) {
        return undefined;
    }
    if (validateNode(node.if, data, pointer, [...(path !== null && path !== void 0 ? path : [])]).length === 0) {
        if (node.then) {
            // reduce creates a new node
            const { node: schemaNode } = node.then.reduceNode(data);
            if (schemaNode) {
                const nestedDynamicId = (_b = (_a = schemaNode.dynamicId) === null || _a === void 0 ? void 0 : _a.replace(node.dynamicId, "").replace(/^#/, "")) !== null && _b !== void 0 ? _b : "";
                const dynamicId = nestedDynamicId === "" ? `(then)` : nestedDynamicId;
                const schema = mergeSchema(node.then.schema, schemaNode.schema, "if", "then", "else");
                return node.compileSchema(schema, node.then.evaluationPath, node.schemaLocation, `${node.schemaLocation}${dynamicId}`);
            }
        }
    }
    else if (node.else) {
        const { node: schemaNode } = node.else.reduceNode(data);
        if (schemaNode) {
            const nestedDynamicId = (_d = (_c = schemaNode.dynamicId) === null || _c === void 0 ? void 0 : _c.replace(node.dynamicId, "")) !== null && _d !== void 0 ? _d : "";
            const dynamicId = nestedDynamicId === "" ? `(else)` : nestedDynamicId;
            const schema = mergeSchema(node.else.schema, schemaNode.schema, "if", "then", "else");
            return node.compileSchema(schema, node.else.evaluationPath, node.schemaLocation, `${node.schemaLocation}${dynamicId}`);
        }
    }
    return undefined;
}
function validateIfThenElse({ node, data, pointer, path }) {
    // @todo issue with mergeNode
    if (node.if == null) {
        return;
    }
    if (validateNode(node.if, data, pointer, [...(path !== null && path !== void 0 ? path : [])]).length === 0) {
        if (node.then) {
            return validateNode(node.then, data, pointer, path);
        }
    }
    else if (node.else) {
        return validateNode(node.else, data, pointer, path);
    }
}
