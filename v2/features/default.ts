import { SchemaNode } from "../types";
import { getDefaultValue } from "../utils/getDefaultValue";

export function getStringData(node: SchemaNode) {
    if (node.schema.type === "string") {
        node.getDefaultData.push(({ data, node }) => getDefaultValue(node.schema, data, ""));
    }
}

export function getNumberData(node: SchemaNode) {
    if (node.schema.type === "number") {
        node.getDefaultData.push(({ data, node }) => getDefaultValue(node.schema, data, 0));
    }
}

export function getIntegerData(node: SchemaNode) {
    if (node.schema.type === "number") {
        node.getDefaultData.push(({ data, node }) => getDefaultValue(node.schema, data, 0));
    }
}

export function getNullData(node: SchemaNode) {
    if (node.schema.type === "null") {
        node.getDefaultData.push(({ data, node }) => getDefaultValue(node.schema, data, null));
    }
}

export function getBooleanData(node: SchemaNode) {
    if (node.schema.type === "boolean") {
        node.getDefaultData.push(({ data, node }) => getDefaultValue(node.schema, data, false));
    }
}
