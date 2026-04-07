import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationReturnType } from "../../Keyword";
import { SchemaNode } from "../../types";
import { isObject } from "../../utils/isObject";
import { validateNode } from "../../validateNode";

const KEYWORD = "items";

export const itemsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseItems,
    addResolve: (node) => (node.prefixItems || node[KEYWORD]) != null,
    resolve: itemsResolver,
    addValidate: ({ schema }) => schema.items != null,
    validate: validateItems
};

function itemsResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.prefixItems?.[key as number]) {
        return node.prefixItems[key as number];
    }
    if (node.items) {
        return node.items;
    }
}

export function parseItems(node: SchemaNode) {
    const { schema, evaluationPath } = node;
    const items = schema[KEYWORD];
    if (items == null || typeof items === "boolean") {
        return;
    }

    if (isObject(items)) {
        const propertyNode = node.compileSchema(
            items,
            `${evaluationPath}/${KEYWORD}`,
            `${node.schemaLocation}/${KEYWORD}`
        );
        node.items = propertyNode;
        return;
    }

    if (Array.isArray(items)) {
        node.prefixItems = items.map((itemSchema, index) =>
            node.compileSchema(
                itemSchema,
                `${evaluationPath}/${KEYWORD}/${index}`,
                `${node.schemaLocation}/${KEYWORD}/${index}`
            )
        );
        return;
    }

    return node.createError("schema-error", {
        pointer: evaluationPath,
        schema,
        value: undefined,
        message: `Keyword '${KEYWORD}' must be an object or array - received '${typeof items}'`
    });
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
        return node.createError("invalid-data-error", { pointer, value: data, schema });
    }

    const errors: ValidationReturnType = [];
    if (node.prefixItems) {
        // note: schema is valid when data does not have enough elements as defined by array-list
        for (let i = 0; i < Math.min(node.prefixItems.length, data.length); i += 1) {
            const itemData = data[i];
            const itemNode = node.prefixItems[i];
            const result = validateNode(itemNode, itemData, `${pointer}/${i}`, path);
            errors.push(...result);
        }
        return errors;
    }

    if (node.items) {
        for (let i = 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = validateNode(node.items, itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
