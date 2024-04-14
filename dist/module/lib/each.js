import getTypeOf from "./getTypeOf";
import { isSchemaNode } from "./schemaNode";
/**
 * Iterates over data, retrieving its schema
 *
 * @param draft - validator
 * @param data - the data to iterate
 * @param callback - will be called with (schema, data, pointer) on each item
 * @param [schema] - the schema matching the data. Defaults to rootSchema
 * @param [pointer] - pointer to current data. Default to rootPointer
 */
export function each(schemaNode, data, callback) {
    const node = schemaNode.resolveRef();
    const { draft, schema, pointer } = node;
    callback(schema, data, pointer);
    const dataType = getTypeOf(data);
    if (dataType === "object") {
        Object.keys(data).forEach((key) => {
            const nextNode = draft.step(node, key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, data[key], callback);
            }
        });
    }
    else if (dataType === "array") {
        data.forEach((next, key) => {
            const nextNode = draft.step(node, key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, data[key], callback);
            }
        });
    }
}
