import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../types";
import { isObject } from "../../lib/utils/isObject";
import { JsonError } from "../../lib/types";

itemsListResolver.toJSON = () => "itemsListResolver";
function itemsListResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.itemsList[key as number]) {
        return node.itemsList[key as number];
    }
}

itemsObjectResolver.toJSON = () => "itemsObjectResolver";
function itemsObjectResolver({ node }: JsonSchemaResolverParams) {
    return node.itemsObject;
}

export function parseItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(schema.items, `${spointer}/items`, `${node.schemaId}/items`);
        node.itemsObject = propertyNode;
        node.resolvers.push(itemsObjectResolver);
    } else if (Array.isArray(schema.items)) {
        node.itemsList = schema.items.map((itemSchema, index) =>
            node.compileSchema(itemSchema, `${spointer}/items/${index}`, `${node.schemaId}/items/${index}`)
        );
        node.resolvers.push(itemsListResolver);
    }
}

export function itemsValidator({ schema, validators }: SchemaNode) {
    if (schema.items == null) {
        return;
    }
    validators.push(validateItems);
}

validateItems.toJSON = () => "validateItems";
function validateItems({
    node,
    data,
    pointer = "#",
    path
}: JsonSchemaValidatorParams): JsonError | JsonError[] | undefined {
    const { schema } = node;
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    // @draft >= 7 bool schema
    if (schema.items === false) {
        if (Array.isArray(data) && data.length === 0) {
            return undefined;
        }
        return node.errors.invalidDataError({ pointer, value: data, schema });
    }

    const errors: JsonError[] = [];
    if (node.itemsList) {
        // note: schema is valid when data does not have enough elements as defined by array-list
        for (let i = 0; i < Math.min(node.itemsList.length, data.length); i += 1) {
            const itemData = data[i];
            // @todo v1 reevaluate: incomplete schema is created here?
            const itemNode = node.itemsList[i];
            const result = itemNode.validate(itemData, `${pointer}/${i}`, path);
            errors.push(...result);
        }
        return errors;
    }

    if (node.itemsObject) {
        for (let i = 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = node.itemsObject.validate(itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
