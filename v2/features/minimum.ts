import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function minimumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minimum)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (isNaN(schema.minimum)) {
            return undefined;
        }
        if (schema.minimum > data) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        if (schema.exclusiveMinimum === true && schema.minimum === data) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}
