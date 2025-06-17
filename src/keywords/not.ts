import { Keyword, JsonSchemaValidatorParams } from "../Keyword.js";
import { SchemaNode } from "../types.js";
import { validateNode } from "../validateNode.js";

export const notKeyword: Keyword = {
    id: "not",
    keyword: "not",
    parse: parseNot,
    addValidate: (node) => node.not != null,
    validate: validateNot
};

export function parseNot(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    if (schema.not != null) {
        node.not = node.compileSchema(schema.not, `${evaluationPath}/not`, `${schemaLocation}/not`);
    }
}

function validateNot({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (validateNode(node.not, data, pointer, path).length === 0) {
        return node.createError("not-error", { value: data, not: schema.not, pointer, schema });
    }
}
