import { isObject } from "../lib/utils/isObject";
import { isSchemaNode, SchemaNode } from "./types";
import { getValue } from "./utils/getValue";

export type EachCallback = (node: SchemaNode, data: unknown, pointer: string) => void;

export function each(node: SchemaNode, data: unknown, callback: EachCallback, pointer = "#") {
    const currentNode = node.resolveRef();
    callback(currentNode, data, pointer);

    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            const nextNode = currentNode.get(key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    } else if (Array.isArray(data)) {
        data.forEach((next: unknown, key: number) => {
            const nextNode = currentNode.get(key, data);
            if (isSchemaNode(nextNode)) {
                each(nextNode, getValue(data, key), callback, `${pointer}/${key}`);
            }
        });
    }
}
