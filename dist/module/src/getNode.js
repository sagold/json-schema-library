import { isJsonError } from "./types";
import { split } from "@sagold/json-pointer";
import { getValue } from "./utils/getValue";
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
export function getNode(pointer, data, options = {}) {
    var _a, _b, _c;
    options.path = (_a = options.path) !== null && _a !== void 0 ? _a : [];
    options.withSchemaWarning = (_b = options.withSchemaWarning) !== null && _b !== void 0 ? _b : false;
    options.pointer = (_c = options.pointer) !== null && _c !== void 0 ? _c : "#";
    const node = this;
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
