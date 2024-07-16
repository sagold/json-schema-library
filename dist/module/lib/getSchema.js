import gp from "@sagold/json-pointer";
import { isJsonError } from "./types";
const emptyObject = {};
/**
 * Returns a node containing json-schema of a data-json-pointer.
 *
 * To resolve dynamic schema where the type of json-schema is evaluated by
 * its value, a data object has to be passed in options.
 *
 * Per default this function will return `undefined` schema for valid properties
 * that do not have a defined schema. Use the option `withSchemaWarning: true` to
 * receive an error with `code: schema-warning` containing the location of its
 * last evaluated json-schema.
 *
 * Example:
 *
 * ```ts
 * draft.setSchema({ type: "object", properties: { title: { type: "string" } } });
 * const result = draft.getSchema({  pointer: "#/title" }, data: { title: "my header" });
 * const schema = isSchemaNode(result) ? result.schema : undefined;
 * // schema = { type: "string" }
 * ```
 *
 * @param draft
 * @param [options.pointer] - json pointer in data to get the json schema for
 * @param [options.data] - the data object, which includes the json pointers value. This is optional, as
 *    long as no oneOf, anyOf, etc statement is part of the pointers schema
 * @param [options.schema] - the json schema to iterate. Defaults to draft.rootSchema
 * @param [options.withSchemaWarning] - if true returns an error instead of `undefined` for valid properties missing a schema definition
 * @return json-error or node containing schema of requested json-pointer location
 */
export default function getSchema(draft, options = emptyObject) {
    const { pointer = "#", data, schema = draft.rootSchema, withSchemaWarning = false } = options;
    const path = gp.split(pointer);
    const node = draft.createNode(schema).resolveRef();
    const result = _getSchema(node, path, data);
    if (!withSchemaWarning && isJsonError(result) && result.code === "schema-warning") {
        return draft.createNode(undefined);
    }
    return result;
}
function _getSchema(node, path, data = emptyObject) {
    if (path.length === 0) {
        return node.resolveRef();
    }
    const key = path.shift(); // step key
    const nextNode = node.draft.step(node, key, data); // step schema
    if (isJsonError(nextNode)) {
        return nextNode;
    }
    // @ts-expect-error data
    data = data[key]; // step data
    return _getSchema(nextNode, path, data);
}
