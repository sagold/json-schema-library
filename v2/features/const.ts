import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";
import equal from "fast-deep-equal";

export function constValidator({ schema, validators }: SchemaNode): void {
    if (schema.const === undefined) {
        return;
    }
    validators.push(({ node, data, pointer }: JsonSchemaValidatorParams) => {
        if (!equal(data, node.schema.const)) {
            return [node.draft.errors.constError({ pointer, schema, value: data, expected: node.schema.const })];
        }
    });
}
