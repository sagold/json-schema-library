import ucs2decode from "../../lib/utils/punycode.ucs2decode";
import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function maxLengthValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.maxLength)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (typeof data !== "string") {
            return;
        }

        const { schema } = node;
        const length = ucs2decode(data).length;
        if (schema.maxLength < length) {
            return node.errors.maxLengthError({
                maxLength: schema.maxLength,
                length,
                pointer,
                schema,
                value: data
            });
        }
    });
}

export function minLengthValidator({ schema, validators }: SchemaNode): void {
    if (isNaN(schema.minLength)) {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        if (typeof data !== "string") {
            return;
        }
        const { schema } = node;
        const length = ucs2decode(data).length;
        if (schema.minLength <= length) {
            return;
        }
        if (schema.minLength === 1) {
            return node.errors.minLengthOneError({
                minLength: schema.minLength,
                length,
                pointer,
                schema,
                value: data
            });
        }
        return node.errors.minLengthError({
            minLength: schema.minLength,
            length,
            pointer,
            schema,
            value: data
        });
    });
}
