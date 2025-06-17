import { GetNodeOptions, isSchemaNode, SchemaNode } from "./SchemaNode.js";
import { isJsonError, NodeOrError, OptionalNodeOrError } from "./types.js";
import { getValue } from "./utils/getValue.js";

// prettier-ignore
export function getNodeChild(key: string | number, data: unknown, options: { withSchemaWarning: true } & GetNodeOptions): NodeOrError;
// prettier-ignore
export function getNodeChild(key: string | number, data: unknown, options: { createSchema: true } & GetNodeOptions): NodeOrError;
export function getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;

/**
 * @returns child node identified by property as SchemaNode
 */
export function getNodeChild(
    key: string | number,
    data?: unknown,
    options: GetNodeOptions = {}
): OptionalNodeOrError | NodeOrError {
    options.path = options.path ?? [];

    options.withSchemaWarning = options.withSchemaWarning ?? false;
    options.pointer = options.pointer ?? "#";
    const { path, pointer } = options;

    let node = this as SchemaNode;
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
        const newNode = node.compileSchema(
            node.createSchema(getValue(data, key)),
            `${node.evaluationPath}/additional`,
            `${node.schemaLocation}/additional`
        );
        return { node: newNode, error: undefined };
    }

    if (options.withSchemaWarning === true) {
        const error = node.createError("schema-warning", { pointer, value: data, schema: node.schema, key });
        return { node: undefined, error };
    }

    return { node: undefined, error: undefined };
}
