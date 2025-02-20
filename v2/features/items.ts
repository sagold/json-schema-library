import { JsonSchemaResolverParams, SchemaNode } from "../compiler/types";
import { isObject } from "../../lib/utils/isObject";

itemsListResolver.toJSON = () => "itemsListResolver";
function itemsListResolver({ node, key }: JsonSchemaResolverParams) {
    return node.itemsList[key as number];
}

itemsObjectResolver.toJSON = () => "itemsObjectResolver";
function itemsObjectResolver({ node }: JsonSchemaResolverParams) {
    return node.itemsObject;
}

export function parseItems(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(draft, schema.items, `${spointer}/items`, node);
        node.itemsObject = propertyNode;
        node.resolvers.push(itemsObjectResolver);
    } else if (Array.isArray(schema.items)) {
        node.itemsList = schema.items.map((itemSchema, index) =>
            node.compileSchema(draft, itemSchema, `${spointer}/items/${index}`, node)
        );
        node.resolvers.push(itemsListResolver);
    }
}
