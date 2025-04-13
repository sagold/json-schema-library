import { isSchemaNode } from "../types";
function eachProperty(nodeList, o) {
    if (o != null) {
        Object.values(o).forEach((node) => toSchemaNodes(node, nodeList));
    }
}
function eachItem(nodeList, a) {
    if (a != null) {
        a.forEach((node) => toSchemaNodes(node, nodeList));
    }
}
export function toSchemaNodes(node, nodeList = []) {
    if (!isSchemaNode(node)) {
        return nodeList;
    }
    nodeList.push(node);
    eachProperty(nodeList, node.$defs);
    node.additionalItems && toSchemaNodes(node.additionalItems, nodeList);
    node.additionalProperties && toSchemaNodes(node.additionalProperties, nodeList);
    eachItem(nodeList, node.allOf);
    eachItem(nodeList, node.anyOf);
    node.contains && toSchemaNodes(node.contains, nodeList);
    eachProperty(nodeList, node.dependentSchemas);
    node.if && toSchemaNodes(node.if, nodeList);
    node.else && toSchemaNodes(node.else, nodeList);
    node.then && toSchemaNodes(node.then, nodeList);
    node.items && toSchemaNodes(node.items, nodeList);
    eachItem(nodeList, node.prefixItems);
    node.not && toSchemaNodes(node.not, nodeList);
    eachItem(nodeList, node.oneOf);
    node.patternProperties &&
        Object.values(node.patternProperties).forEach(({ node }) => toSchemaNodes(node, nodeList));
    eachProperty(nodeList, node.properties);
    node.propertyNames && toSchemaNodes(node.propertyNames, nodeList);
    node.unevaluatedProperties && toSchemaNodes(node.unevaluatedProperties, nodeList);
    node.unevaluatedItems && toSchemaNodes(node.unevaluatedItems, nodeList);
    return nodeList;
}
