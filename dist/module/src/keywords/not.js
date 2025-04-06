import { validateNode } from "../validateNode";
export const notKeyword = {
    id: "not",
    keyword: "not",
    parse: parseNot,
    addValidate: (node) => node.not != null,
    validate: validateNot
};
export function parseNot(node) {
    const { schema, spointer, schemaId } = node;
    if (schema.not != null) {
        node.not = node.compileSchema(schema.not, `${spointer}/not`, `${schemaId}/not`);
    }
}
function validateNot({ node, data, pointer, path }) {
    const { schema } = node;
    if (validateNode(node.not, data, pointer, path).length === 0) {
        return node.errors.notError({ value: data, not: schema.not, pointer, schema });
    }
}
