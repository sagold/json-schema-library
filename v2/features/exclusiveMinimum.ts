import { SchemaNode } from "../compiler/types";

export function exclusiveMinimumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.exclusiveMinimum)) {
        return undefined;
    }
    validators.push(({ node, data, pointer }) => {
        if (typeof data !== "number") {
            return undefined;
        }
        if (schema.exclusiveMinimum >= data) {
            return node.draft.errors.minimumError({
                minimum: schema.exclusiveMinimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
    });
}
