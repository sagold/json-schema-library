import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function maxItemsValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.maxItems)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (Array.isArray(data) && schema.maxItems < data.length) {
            return node.draft.errors.maxItemsError({
                maximum: schema.maxItems,
                length: data.length,
                schema,
                value: data,
                pointer
            });
        }
    });
}

export function minItemsValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minItems)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (!Array.isArray(data)) {
            return;
        }
        if (schema.minItems > data.length) {
            if (schema.minItems === 1) {
                return node.draft.errors.minItemsOneError({
                    minItems: schema.minItems,
                    length: data.length,
                    pointer,
                    schema,
                    value: data
                });
            }
            return node.draft.errors.minItemsError({
                minItems: schema.minItems,
                length: data.length,
                pointer,
                schema,
                value: data
            });
        }
    });
}
