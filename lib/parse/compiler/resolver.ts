import { isObject } from "../../utils/isObject";
import { JsonSchemaResolverParams } from "./types";

function getValue(data: unknown, key: string | number) {
    if (isObject(data)) {
        return data[key];
    } else if (Array.isArray(data)) {
        return data[key as number];
    }
}

export function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce(value);
    }
    const schema = node.draft.createSchemaOf(value);
    const temporaryNode = node.compileSchema(node.draft, schema);
    return temporaryNode;
}

export function propertyResolver({ node, key }: JsonSchemaResolverParams) {
    const schemaNode = node.children.find((child) => child.key === key);
    if (schemaNode) {
        return schemaNode;
    }
}
