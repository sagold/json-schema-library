import { SchemaNode } from "../types";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { validateNode } from "../validateNode";

export const prefixItemsKeyword: Keyword = {
    id: "prefixItems",
    keyword: "prefixItems",
    parse: parseItems,
    addResolve: (node) => node.prefixItems != null,
    resolve: prefixItemsResolver,
    addValidate: ({ schema }) => schema.prefixItems != null,
    validate: validatePrefixItems
};

function prefixItemsResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.prefixItems[key as number]) {
        return node.prefixItems[key as number];
    }
}

export function parseItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.prefixItems)) {
        node.prefixItems = schema.prefixItems.map((itemSchema, index) =>
            node.compileSchema(itemSchema, `${spointer}/prefixItems/${index}`, `${node.schemaId}/prefixItems/${index}`)
        );
    }
}

function validatePrefixItems({ node, data, pointer = "#", path }: JsonSchemaValidatorParams) {
    // const { schema } = node;
    if (!Array.isArray(data) || data.length === 0) {
        return;
    }

    // @draft >= 7 bool schema
    // if (schema.items === false) {
    //     if (Array.isArray(data) && data.length === 0) {
    //         return undefined;
    //     }
    //     return node.createError("InvalidDataError", { pointer, value: data, schema });
    // }

    const errors: ValidationResult[] = [];
    if (node.prefixItems) {
        // note: schema is valid when data does not have enough elements as defined by array-list
        for (let i = 0; i < Math.min(node.prefixItems.length, data.length); i += 1) {
            const itemData = data[i];
            // @todo v1 reevaluate: incomplete schema is created here?
            const itemNode = node.prefixItems[i];
            const result = validateNode(itemNode, itemData, `${pointer}/${i}`, path);
            errors.push(...result);
        }
        return errors;
    }
}
