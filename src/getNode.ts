import { GetNodeOptions, SchemaNode } from "./SchemaNode.js";
import { isJsonError, NodeOrError, OptionalNodeOrError } from "./types.js";
import { split } from "@sagold/json-pointer";
import { getValue } from "./utils/getValue.js";

// prettier-ignore
export function getNode(pointer: string, data: unknown, options: { withSchemaWarning: true } & GetNodeOptions): NodeOrError;
export function getNode(pointer: string, data: unknown, options: { createSchema: true } & GetNodeOptions): NodeOrError;
export function getNode(pointer: string, data?: unknown, options?: GetNodeOptions): OptionalNodeOrError;
/**
 * Returns a node containing JSON Schema of a data JSON Pointer.
 *
 * To resolve dynamic schema where the type of JSON Schema is evaluated by
 * its value, a data object has to be passed in options.
 *
 * Per default this function will return `undefined` schema for valid properties
 * that do not have a defined schema. Use the option `withSchemaWarning: true` to
 * receive an error with `code: schema-warning` containing the location of its
 * last evaluated json-schema.
 *
 * @returns { node } or { error } where node can also be undefined (valid but undefined)
 */
export function getNode(
    pointer: string,
    data?: unknown,
    options: GetNodeOptions = {}
): OptionalNodeOrError | NodeOrError {
    options.path = options.path ?? [];
    options.withSchemaWarning = options.withSchemaWarning ?? false;
    options.pointer = options.pointer ?? "#";

    const node = this as SchemaNode;
    const keys = split(pointer);
    if (keys.length === 0) {
        const result = node.resolveRef(options);
        return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
    }
    let currentPointer = "#";
    let currentNode = node;
    for (let i = 0, l = keys.length; i < l; i += 1) {
        currentPointer = `${currentPointer}/${keys[i]}`;
        const result = currentNode.getNodeChild(keys[i], data, { ...options, pointer: currentPointer });
        if (result.error) {
            return result;
        }
        if (result.node == null) {
            return result;
        }
        currentNode = result.node;
        data = getValue(data, keys[i]);
    }
    const result = currentNode.resolveRef(options);
    return isJsonError(result) ? { node: undefined, error: result } : { node: result, error: undefined };
}
