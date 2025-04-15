import { isSchemaNode } from "./SchemaNode";
import { isJsonError } from "./types";
import { getValue } from "./utils/getValue";
/**
 * @returns child node identified by property as SchemaNode
 */
export function getNodeChild(key, data, options = {}) {
    var _a, _b, _c;
    options.path = (_a = options.path) !== null && _a !== void 0 ? _a : [];
    options.withSchemaWarning = (_b = options.withSchemaWarning) !== null && _b !== void 0 ? _b : false;
    options.pointer = (_c = options.pointer) !== null && _c !== void 0 ? _c : "#";
    const { path, pointer } = options;
    let node = this;
    if (node.reducers.length) {
        const result = node.reduceNode(data, { key, path, pointer });
        if (result.error) {
            return result;
        }
        if (isSchemaNode(result.node)) {
            node = result.node;
        }
    }
    for (const resolver of node.resolvers) {
        const schemaNode = resolver({ data, key, node });
        if (isSchemaNode(schemaNode)) {
            return { node: schemaNode, error: undefined };
        }
        if (isJsonError(schemaNode)) {
            return { node: undefined, error: schemaNode };
        }
    }
    const referencedNode = node.resolveRef({ path });
    if (referencedNode !== node) {
        return referencedNode.getNodeChild(key, data, options);
    }
    if (options.createSchema === true) {
        const newNode = node.compileSchema(node.createSchema(getValue(data, key)), `${node.evaluationPath}/additional`, `${node.schemaLocation}/additional`);
        return { node: newNode, error: undefined };
    }
    if (options.withSchemaWarning === true) {
        const error = node.createError("schema-warning", { pointer, value: data, schema: node.schema, key });
        return { node: undefined, error };
    }
    return { node: undefined, error: undefined };
}
