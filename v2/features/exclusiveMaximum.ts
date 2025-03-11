import { SchemaNode } from "../types";

export function exclusiveMaximumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.exclusiveMaximum)) {
        return undefined;
    }
    validators.push(({ node, data, pointer }) => {
        if (typeof data !== "number") {
            return undefined;
        }
        if (schema.exclusiveMaximum <= data) {
            return node.errors.maximumError({
                maximum: schema.exclusiveMaximum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
    });
}
