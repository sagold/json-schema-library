import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams } from "./types";

export function getValue(data: unknown, key: string | number) {
    if (isObject(data)) {
        return data[key];
    } else if (Array.isArray(data)) {
        return data[key as number];
    }
}

additionalPropertyResolver.toJSON = () => "additionalPropertyResolver";
export function additionalPropertyResolver({ node, data, key }: JsonSchemaResolverParams) {
    const value = getValue(data, key);
    if (node.additionalProperties) {
        return node.additionalProperties.reduce({ data: value });
    }
    const schema = node.draft.createSchemaOf(value);
    const temporaryNode = node.compileSchema(node.draft, schema, node.spointer, node);
    return temporaryNode;
}

propertyResolver.toJSON = () => "propertyResolver";
export function propertyResolver({ node, key }: JsonSchemaResolverParams) {
    return node.properties[key];
}
