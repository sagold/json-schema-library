import { JsonSchemaValidatorParams, SchemaNode } from "../compiler/types";

export function parseNot(node: SchemaNode) {
    const { draft, schema, spointer } = node;
    if (schema.not == null) {
        return;
    }
    node.not = node.compileSchema(draft, schema.not, `${spointer}/not`);
}

export function notValidator(node: SchemaNode): void {
    if (node.not == null) {
        return;
    }
    node.validators.push(({ node, data, pointer = "#" }: JsonSchemaValidatorParams) => {
        const { draft, schema } = node;
        if (node.not.validate(data, pointer).length === 0) {
            return draft.errors.notError({ value: data, not: schema.not, pointer, schema });
        }
    });
}
