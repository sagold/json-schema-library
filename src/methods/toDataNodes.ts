import { getValue } from "../utils/getValue";
import { isObject } from "../utils/isObject";
import { SchemaNode } from "../types";

export type DataNode = { node: SchemaNode; value: unknown; pointer: string };

export function toDataNodes(node: SchemaNode, data: unknown, pointer = "#", dataNodes: DataNode[] = []) {
    const currentNode = node.resolveRef();
    dataNodes.push({
        node: currentNode,
        value: data,
        pointer
    });

    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            const { node: nextNode } = currentNode.getChild(key, data);
            if (nextNode) {
                toDataNodes(nextNode, getValue(data, key), `${pointer}/${key}`, dataNodes);
            }
        });
    } else if (Array.isArray(data)) {
        data.forEach((next: unknown, key: number) => {
            const { node: nextNode } = currentNode.getChild(key, data);
            if (nextNode) {
                toDataNodes(nextNode, getValue(data, key), `${pointer}/${key}`, dataNodes);
            }
        });
    }

    return dataNodes;
}
