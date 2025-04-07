import { validateNode } from "../validateNode";
export const prefixItemsKeyword = {
    id: "prefixItems",
    keyword: "prefixItems",
    parse: parseItems,
    addResolve: (node) => node.itemsList != null,
    resolve: prefixItemsResolver,
    addValidate: ({ schema }) => schema.prefixItems != null,
    validate: validatePrefixItems
};
function prefixItemsResolver({ node, key }) {
    if (node.itemsList[key]) {
        return node.itemsList[key];
    }
}
export function parseItems(node) {
    const { schema, spointer } = node;
    if (Array.isArray(schema.prefixItems)) {
        node.itemsList = schema.prefixItems.map((itemSchema, index) => node.compileSchema(itemSchema, `${spointer}/prefixItems/${index}`, `${node.schemaId}/prefixItems/${index}`));
    }
}
function validatePrefixItems({ node, data, pointer = "#", path }) {
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
    const errors = [];
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
