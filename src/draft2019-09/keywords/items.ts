import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationResult } from "../../Keyword";
import { SchemaNode } from "../../types";
import { isObject } from "../../utils/isObject";
import { validateNode } from "../../validateNode";

export const itemsKeyword: Keyword = {
    id: "items",
    keyword: "items",
    parse: parseItems,
    addResolve: (node) => (node.itemsList || node.itemsObject) != null,
    resolve: itemsResolver,
    addValidate: ({ schema }) => schema.items != null,
    validate: validateItems
};

function itemsResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.itemsObject) {
        return node.itemsObject;
    }
    if (node.itemsList[key as number]) {
        return node.itemsList[key as number];
    }
}

export function parseItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(schema.items, `${spointer}/items`, `${node.schemaId}/items`);
        node.itemsObject = propertyNode;
    } else if (Array.isArray(schema.items)) {
        node.itemsList = schema.items.map((itemSchema, index) =>
            node.compileSchema(itemSchema, `${spointer}/items/${index}`, `${node.schemaId}/items/${index}`)
        );
    }
}

function validateItems({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
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

    const errors: ValidationResult[] = [];
    if (node.itemsList) {
        // note: schema is valid when data does not have enough elements as defined by array-list
        for (let i = 0; i < Math.min(node.itemsList.length, data.length); i += 1) {
            const itemData = data[i];
            // @todo v1 reevaluate: incomplete schema is created here?
            const itemNode = node.itemsList[i];
            const result = validateNode(itemNode, itemData, `${pointer}/${i}`, path);
            errors.push(...result);
        }
        return errors;
    }

    if (node.itemsObject) {
        for (let i = 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = validateNode(node.itemsObject, itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
