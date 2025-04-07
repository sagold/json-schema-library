import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../types";
import { validateNode } from "../validateNode";

export const notKeyword: Keyword = {
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

function validateNot({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (validateNode(node.not, data, pointer, path).length === 0) {
        return node.createError("NotError", { value: data, not: schema.not, pointer, schema });
    }
}
