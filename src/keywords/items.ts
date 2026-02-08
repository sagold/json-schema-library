import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { SchemaNode } from "../types";
import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";

export const itemsKeyword: Keyword = {
    id: "items",
    keyword: "items",
    parse: parseItems,
    addResolve: (node) => node.items != null,
    resolve: itemsResolver,
    addValidate: ({ schema }) => schema.items != null,
    validate: validateItems
};

function itemsResolver({ node, key }: JsonSchemaResolverParams) {
    // prefixItems should handle this, abort
    // Note: This keeps features sort independent for arrays
    if (node.prefixItems && node.prefixItems?.length > +key) {
        return;
    }
    return node.items;
}

export function parseItems(node: SchemaNode) {
    const { schema, evaluationPath } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(
            schema.items,
            `${evaluationPath}/items`,
            `${node.schemaLocation}/items`
        );
        node.items = propertyNode;
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
        return node.createError("invalid-data-error", { pointer, value: data, schema });
    }

    const errors: ValidationResult[] = [];
    if (node.items) {
        for (let i = schema.prefixItems?.length ?? 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = validateNode(node.items, itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
