import { Feature, JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode, ValidationResult } from "../types";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";

export const itemsFeature: Feature = {
    id: "items",
    keyword: "items",
    parse: parseItems,
    addResolve: (node) => node.itemsObject != null,
    resolve: itemsResolver,
    addValidate: ({ schema }) => schema.items != null,
    validate: validateItems
};

function itemsResolver({ node, key }: JsonSchemaResolverParams) {
    // prefixItems should handle this, abort
    // Note: This keeps features sort independent for arrays
    if (node.itemsList?.length > +key) {
        return;
    }
    return node.itemsObject;
}

export function parseItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(schema.items, `${spointer}/items`, `${node.schemaId}/items`);
        node.itemsObject = propertyNode;
    }
}

function validateItems({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    const withPrefixItems = Array.isArray(schema.prefixItems);
    if (withPrefixItems && schema.prefixItems.length >= data.length) {
        return undefined;
    }

    if (schema.items === false) {
        if (Array.isArray(data) && data.length === 0) {
            return undefined;
        }
        return node.errors.invalidDataError({ pointer, value: data, schema });
    }

    const errors: ValidationResult[] = [];
    if (node.itemsObject) {
        for (let i = schema.prefixItems?.length ?? 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = validateNode(node.itemsObject, itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
