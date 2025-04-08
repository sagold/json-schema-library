import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";

export type EachCallback = (node: SchemaNode, data: unknown, pointer: string) => void;

export function each(node: SchemaNode, data: unknown, callback: EachCallback, pointer = "#") {
    const currentNode = node.resolveRef();
    callback(currentNode, data, pointer);

    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            const { node: nextNode } = currentNode.getChild(key, data);
            if (nextNode) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    } else if (Array.isArray(data)) {
        data.forEach((next: unknown, key: number) => {
            const { node: nextNode } = currentNode.getChild(key, data);
            if (nextNode) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    }
}
