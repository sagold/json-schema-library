import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { Feature, JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../types";
import { getValue } from "../utils/getValue";

export const additionalItemsFeature: Feature = {
    id: "additionalItems",
    keyword: "additionalItems",
    parse: parseAdditionalItems,
    addResolve: (node: SchemaNode) => node.additionalItems != null,
    resolve: additionalItemsResolver,
    addValidate: ({ schema }) =>
        schema.additionalItems != null &&
        schema.additionalItems !== true &&
        schema.items != null &&
        !isObject(schema.items),
    validate: validateAdditionalItems
};

// must come as last resolver
export function parseAdditionalItems(node: SchemaNode) {
    const { schema, spointer, schemaId } = node;
    if (isObject(schema.additionalItems) || schema.additionalItems === true) {
        node.additionalItems = node.compileSchema(
            schema.additionalItems,
            `${spointer}/additionalItems`,
            `${schemaId}/additionalItems`
        );
    }
}

export function additionalItemsValidator(node: SchemaNode): void {
    if (additionalItemsFeature.addValidate(node)) {
        node.validators.push(additionalItemsFeature.validate);
    }
}

additionalItemsResolver.toJSON = () => "additionalItemsResolver";
function additionalItemsResolver({ node, key, data }: JsonSchemaResolverParams) {
    if (Array.isArray(data)) {
        // @attention: items, etc should already have been tried
        const value = getValue(data, key);
        return node.additionalItems.reduce({ data: value });
    }
}

function validateAdditionalItems({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
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
    const errors: JsonError[] = [];
    for (let i = startIndex; i < data.length; i += 1) {
        const item = data[i];
        if (node.additionalItems) {
            const validationResult = node.additionalItems.validate(item, `${pointer}/${i}`);
            errors.push(...validationResult);
        } else if (schema.additionalItems === false) {
            errors.push(
                node.errors.additionalItemsError({
                    key: i,
                    pointer: `${pointer}/${i}`,
                    value: data,
                    schema
                })
            );
        }
    }
    return errors;
}
