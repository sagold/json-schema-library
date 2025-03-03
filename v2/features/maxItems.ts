import { SchemaNode } from "../compiler/types";

export function maxItemsValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.maxItems)) {
        return;
    }
    validators.push(({ node, data, pointer }) => {
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
