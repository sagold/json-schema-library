import { getValue } from "../utils/getValue.js";
import { isObject } from "../utils/isObject.js";
export function toDataNodes(node, data, pointer = "#", dataNodes = []) {
    const currentNode = node.resolveRef();
    dataNodes.push({
        node: currentNode,
        value: data,
        pointer
    });
    if (isObject(data)) {
        Object.keys(data).forEach((key) => {
            const { node: nextNode } = currentNode.getNodeChild(key, data);
            if (nextNode) {
                toDataNodes(nextNode, getValue(data, key), `${pointer}/${key}`, dataNodes);
            }
        });
    }
    else if (Array.isArray(data)) {
        data.forEach((next, key) => {
            const { node: nextNode } = currentNode.getNodeChild(key, data);
            if (nextNode) {
                toDataNodes(nextNode, getValue(data, key), `${pointer}/${key}`, dataNodes);
            }
        });
    }
    return dataNodes;
}
