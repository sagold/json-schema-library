import { getValue } from "../getValue";
import { JsonSchemaResolverParams } from "./types";

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

itemsListResolver.toJSON = () => "itemsListResolver";
export function itemsListResolver({ node, key }: JsonSchemaResolverParams) {
    return node.itemsList[key as number];
}

itemsObjectResolver.toJSON = () => "itemsObjectResolver";
export function itemsObjectResolver({ node }: JsonSchemaResolverParams) {
    return node.itemsObject;
}
