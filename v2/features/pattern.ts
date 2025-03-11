import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function patternValidator({ schema, validators }: SchemaNode): void {
    if (typeof schema.pattern !== "string") {
        return;
    }
    validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (typeof data !== "string") {
            return;
        }
        const pattern = new RegExp(schema.pattern, "u");
        if (pattern.test(data) === false) {
            return draft.errors.patternError({
                pattern: schema.pattern,
                description: schema.patternExample || schema.pattern,
                received: data,
                schema,
                value: data,
                pointer
            });
        }
        return undefined;
    });
}
