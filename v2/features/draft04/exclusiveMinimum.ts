import { SchemaNode } from "../../types";

export function exclusiveMinimumValidator({ schema, validators }: SchemaNode): void {
    if (schema.exclusiveMinimum !== true || isNaN(schema.minimum)) {
        return undefined;
    }
    validators.push(({ node, data, pointer }) => {
        if (typeof data !== "number") {
            return undefined;
        }
        if (schema.exclusiveMinimum && schema.minimum === data) {
            return node.errors.minimumError({
                minimum: schema.exclusiveMinimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
    });
}
