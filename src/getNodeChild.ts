import { GetNodeOptions, isSchemaNode, SchemaNode } from "./SchemaNode";
import { isJsonError, NodeOrError, OptionalNodeOrError } from "./types";
import { getValue } from "./utils/getValue";
import { mergeNode } from "./mergeNode";

/**
 * `$ref` is an applicator in draft 2019-09 and later: it combines with any
 * sibling keywords rather than replacing them. Those drafts register a `$ref`
 * reducer, whereas draft-07 and earlier do not (their siblings are ignored).
 */
function hasRefReducer(node: SchemaNode): boolean {
    return node.reducers.some((reducer) => (reducer.toJSON?.() ?? reducer.name) === "$ref");
}

export function getNodeChild(key: string | number, data: unknown, options: { withSchemaWarning: true } & GetNodeOptions): NodeOrError; // prettier-ignore
export function getNodeChild(key: string | number, data: unknown, options: { createSchema: true } & GetNodeOptions): NodeOrError; // prettier-ignore
export function getNodeChild(key: string | number, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;

/**
 * Returns the child for the given property-name or array-index
 *
 * - the returned child node is **not reduced**
 * - a child node $ref is resolved
 *
 * @returns { node } or { error } where node can also be undefined (valid but undefined)
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

    // reduce parent
    // @ts-expect-error implicitely any
    let parentNode = this as SchemaNode;
    if (parentNode.reducers.length) {
        const result = parentNode.reduceNode(data, { key, path, pointer });
        if (result.error) {
            return result;
        }
        if (isSchemaNode(result.node)) {
            parentNode = result.node;
        }
    }

    // find child node
    for (const resolver of parentNode.resolvers) {
        const schemaNode = resolver({ data, key, node: parentNode });
        // a matching resolver found an error, return
        if (isJsonError(schemaNode)) {
            return { node: undefined, error: schemaNode };
        }
        // a matching resolver found a child node, return
        if (isSchemaNode(schemaNode)) {
            const resolved = schemaNode.resolveRef({ pointer, path });
            if (isJsonError(resolved)) {
                return { node: undefined, error: resolved };
            }
            // @draft >= 2019-09: merge the child's sibling keywords onto the
            // resolved target so assertions next to a $ref (e.g. an `oneOf`
            // of allowed values) survive resolution. `$ref` is dropped from
            // the merged schema as it has been resolved. Older drafts have no
            // $ref reducer and retain the historical "siblings ignored" rule.
            if (resolved !== schemaNode && hasRefReducer(schemaNode)) {
                return { node: mergeNode(schemaNode, resolved, "$ref") ?? resolved, error: undefined };
            }
            return { node: resolved, error: undefined };
        }
    }

    // no child node was found, but the child node is valid
    if (options.createSchema === true) {
        const newNode = parentNode.compileSchema(
            parentNode.createSchema(getValue(data, key)),
            `${parentNode.evaluationPath}/additional`,
            `${parentNode.schemaLocation}/additional`
        );
        return { node: newNode, error: undefined };
    }

    if (options.withSchemaWarning === true) {
        const error = parentNode.createError("schema-warning", {
            pointer,
            value: data,
            schema: parentNode.schema,
            key
        });
        return { node: undefined, error };
    }

    return { node: undefined };
}
