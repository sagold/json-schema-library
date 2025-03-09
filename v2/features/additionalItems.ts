import { JsonError } from "../../lib/types";
import { isObject } from "../../lib/utils/isObject";
import { JsonSchemaResolverParams, JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import { getValue } from "../utils/getValue";

// must come as last resolver
export function parseAdditionalItems(node: SchemaNode) {
    const { schema, spointer } = node;
    if (schema.additionalItems === false) {
        // no additional items - no resolver required
        return;
    }
    if (isObject(schema.additionalItems) || schema.additionalItems === true) {
        // precompile additional items schema
        node.additionalItems = node.compileSchema(schema.additionalItems, `${spointer}/additionalItems`);
    }
    // add resolver for get additionalItem
    node.resolvers.push(additionalItemsResolver);
}

additionalItemsResolver.toJSON = () => "additionalItemsResolver";
function additionalItemsResolver({ node, key, data }: JsonSchemaResolverParams) {
    console.log("resolve additional");
    if (!Array.isArray(data)) {
        console.log(data, "not an array");
        return;
    }

    // @attention: items, etc should already have been tried
    const value = getValue(data, key);
    if (node.additionalItems) {
        console.log("addditional: reduce");
        return node.additionalItems.reduce({ data: value });
    }

    // @todo should we keep this to resolve unevaluatedItems validator?
    // This solves the case where unevaluatedItems=true is nested in allOf
    // @note this could be a json-schema-feature for custom getSchema method
    if (node.schema.unevaluatedItems === true) {
        const schema = node.draft.createSchemaOf(value);
        if (schema) {
            const temporaryNode = node.compileSchema(schema, node.spointer);
            return temporaryNode;
        }
    }
}

export function additionalItemsValidator({ schema, validators }: SchemaNode): void {
    if (schema.additionalItems === true || schema.additionalItems == null) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { schema } = node;
        if (!Array.isArray(data) || data.length === 0 || isObject(schema.items)) {
            // - no items to validate
            // - schema object catches all items
            return;
        }
        if (schema.items == null || (Array.isArray(schema.items) && schema.items.length >= data.length)) {
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
                    node.draft.errors.additionalItemsError({
                        key: i,
                        pointer: `${pointer}/${i}`,
                        value: data,
                        schema
                    })
                );
            }
        }
        return errors;
    });
}
