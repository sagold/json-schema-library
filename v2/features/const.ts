import { JsonSchemaValidatorParams, SchemaNode } from "../types";
import equal from "fast-deep-equal";

export function constValidator({ schema, validators }: SchemaNode): void {
    if (schema.const === undefined) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (!equal(data, node.schema.const)) {
            return [node.errors.constError({ pointer, schema, value: data, expected: node.schema.const })];
        }
    });
}
