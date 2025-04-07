import { isObject } from "../utils/isObject";
import { validateNode } from "../validateNode";
export const itemsKeyword = {
    id: "items",
    keyword: "items",
    parse: parseItems,
    addResolve: (node) => node.itemsObject != null,
    resolve: itemsResolver,
    addValidate: ({ schema }) => schema.items != null,
    validate: validateItems
};
function itemsResolver({ node, key }) {
    var _a;
    // prefixItems should handle this, abort
    // Note: This keeps features sort independent for arrays
    if (((_a = node.itemsList) === null || _a === void 0 ? void 0 : _a.length) > +key) {
        return;
    }
    return node.itemsObject;
}
export function parseItems(node) {
    const { schema, spointer } = node;
    if (isObject(schema.items)) {
        const propertyNode = node.compileSchema(schema.items, `${spointer}/items`, `${node.schemaId}/items`);
        node.itemsObject = propertyNode;
    }
}
function validateItems({ node, data, pointer = "#", path }) {
    var _a, _b;
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
        return node.createError("InvalidDataError", { pointer, value: data, schema });
    }
    const errors = [];
    if (node.itemsObject) {
        for (let i = (_b = (_a = schema.prefixItems) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0; i < data.length; i += 1) {
            const itemData = data[i];
            const result = validateNode(node.itemsObject, itemData, `${pointer}/${i}`, path);
            if (result) {
                errors.push(...result);
            }
        }
        return errors;
    }
}
