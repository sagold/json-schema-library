import { isObject } from "../utils/isObject";
import { getValue } from "../utils/getValue";
import { validateNode } from "../validateNode";
export const additionalItemsKeyword = {
    id: "additionalItems",
    keyword: "additionalItems",
    order: -10,
    parse: parseAdditionalItems,
    addResolve: (node) => node.additionalItems != null,
    resolve: additionalItemsResolver,
    addValidate: ({ schema }) => schema.additionalItems != null &&
        schema.additionalItems !== true &&
        schema.items != null &&
        !isObject(schema.items),
    validate: validateAdditionalItems
};
// must come as last resolver
export function parseAdditionalItems(node) {
    const { schema, spointer, schemaId } = node;
    if (isObject(schema.additionalItems) || schema.additionalItems === true) {
        node.additionalItems = node.compileSchema(schema.additionalItems, `${spointer}/additionalItems`, `${schemaId}/additionalItems`);
    }
}
function additionalItemsResolver({ node, key, data }) {
    if (Array.isArray(data)) {
        // @attention: items, etc should already have been tried
        const value = getValue(data, key);
        return node.additionalItems.reduce(value);
    }
}
function validateAdditionalItems({ node, data, pointer, path }) {
    const { schema } = node;
    if (!Array.isArray(data) || data.length === 0) {
        // - no items to validate
        return;
    }
    if (Array.isArray(schema.items) && schema.items.length >= data.length) {
        // - no additional items
        return;
    }
    const startIndex = Array.isArray(schema.items) ? schema.items.length : 0;
    const errors = [];
    for (let i = startIndex; i < data.length; i += 1) {
        const item = data[i];
        if (node.additionalItems) {
            const validationResult = validateNode(node.additionalItems, item, `${pointer}/${i}`, path);
            validationResult && errors.push(...validationResult);
        }
        else if (schema.additionalItems === false) {
            errors.push(node.errors.additionalItemsError({
                key: i,
                pointer: `${pointer}/${i}`,
                value: data,
                schema
            }));
        }
    }
    return errors;
}
