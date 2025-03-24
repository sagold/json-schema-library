import { getValue } from "./utils/getValue";
import { isObject } from "./utils/isObject";
import { isSchemaNode } from "./types";
export function each(node, data, callback, pointer = "#") {
    const currentNode = node.resolveRef();
    callback(currentNode, data, pointer);
    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            const nextNode = currentNode.get(key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    }
    else if (Array.isArray(data)) {
        data.forEach((next, key) => {
            const nextNode = currentNode.get(key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    }
}
