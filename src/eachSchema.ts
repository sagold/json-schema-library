import { isSchemaNode, SchemaNode } from "./types";

export type EachSchemaCallback = (node: SchemaNode) => unknown | true;

function eachProperty(callback: EachSchemaCallback, o?: Record<string, SchemaNode | unknown>) {
    if (o != null) {
        Object.values(o).forEach((node) => eachSchema(node, callback));
    }
}

function eachItem(callback: EachSchemaCallback, a?: SchemaNode[]) {
    if (a != null) {
        a.forEach((node) => eachSchema(node, callback));
    }
}

export function eachSchema(node: SchemaNode | unknown, callback: EachSchemaCallback) {
    if (!isSchemaNode(node)) {
        return;
    }
    if (callback(node) === true) {
        return;
    }
    eachProperty(callback, node.$defs);
    node.additionalItems && eachSchema(node.additionalItems, callback);
    node.additionalProperties && eachSchema(node.additionalProperties, callback);
    eachItem(callback, node.allOf);
    eachItem(callback, node.anyOf);
    node.contains && eachSchema(node.contains, callback);
    eachProperty(callback, node.dependencies);
    eachProperty(callback, node.dependentSchemas);
    node.if && eachSchema(node.if, callback);
    node.else && eachSchema(node.else, callback);
    node.then && eachSchema(node.then, callback);
    node.itemsObject && eachSchema(node.itemsObject, callback);
    eachItem(callback, node.itemsList);
    node.not && eachSchema(node.not, callback);
    eachItem(callback, node.oneOf);
    node.patternProperties && Object.values(node.patternProperties).forEach(({ node }) => eachSchema(node, callback));
    eachProperty(callback, node.properties);
    node.propertyNames && eachSchema(node.propertyNames, callback);
    node.propertyNames && eachSchema(node.propertyNames, callback);
    node.unevaluatedProperties && eachSchema(node.unevaluatedProperties, callback);
    node.unevaluatedItems && eachSchema(node.unevaluatedItems, callback);
}
