import { SchemaNode } from "../types";
import { Keyword, JsonSchemaResolverParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { validateNode } from "../validateNode";

export const prefixItemsKeyword: Keyword = {
    id: "prefixItems",
    keyword: "prefixItems",
    parse: parseItems,
    addResolve: (node) => node.itemsList != null,
    resolve: prefixItemsResolver,
    addValidate: ({ schema }) => schema.prefixItems != null,
    validate: validatePrefixItems
};

function prefixItemsResolver({ node, key }: JsonSchemaResolverParams) {
    if (node.itemsList[key as number]) {
        return node.itemsList[key as number];
    }
}

export function parseItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.prefixItems)) {
        node.itemsList = schema.prefixItems.map((itemSchema, index) =>
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
    //     return node.errors.invalidDataError({ pointer, value: data, schema });
    // }

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
}
