import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationReturnType } from "../Keyword";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { validateNode } from "../validateNode";

const KEYWORD = "items";

export const itemsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseItems,
    addResolve: (node) => node[KEYWORD] != null,
    resolve: itemsResolver,
    addValidate: (node) => node[KEYWORD] != null,
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
    const items = node.schema[KEYWORD];
    if (items == null) {
        return;
    }
    if (!(isJsonSchema(items) || isBooleanSchema(items))) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: items,
            message: `Keyword '${KEYWORD}' must be a valid JSON Schema - received '${typeof items}'`
        });
    }

    if (items !== true) {
        // @todo remove skipping boolean schema
        node[KEYWORD] = node.compileSchema(
            items,
            `${node.evaluationPath}/${KEYWORD}`,
            `${node.schemaLocation}/${KEYWORD}`
        );
        return node[KEYWORD].schemaValidation;
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

    const errors: ValidationReturnType = [];
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
