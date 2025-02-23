import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function maximumValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.maximum)) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (isNaN(data as number)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < data) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: data,
                value: data,
                pointer,
                schema
            });
        }
        if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === data) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: data,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}

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
