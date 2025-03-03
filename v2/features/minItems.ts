import { SchemaNode } from "../compiler/types";

export function minItemsValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minItems)) {
        return;
    }
    validators.push(({ node, data, pointer }) => {
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
