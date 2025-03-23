import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const notFeature: Feature = {
    id: "not",
    keyword: "not",
    parse: parseNot,
    addValidate: (node) => node.not != null,
    validate: validateNot
};

export function parseNot(node: SchemaNode) {
    const { schema, spointer, schemaId } = node;
    if (schema.not != null) {
        node.not = node.compileSchema(schema.not, `${spointer}/not`, `${schemaId}/not`);
    }
}

export function notValidator(node: SchemaNode): void {
    if (notFeature.addValidate(node)) {
        node.validators.push(notFeature.validate);
    }
}

function validateNot({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (node.not.validate(data, pointer).length === 0) {
        return node.errors.notError({ value: data, not: schema.not, pointer, schema });
    }
}
