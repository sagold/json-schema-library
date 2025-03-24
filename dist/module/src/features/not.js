export const notFeature = {
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
function validateNot({ node, data, pointer = "#" }) {
    const { schema } = node;
    if (node.not.validate(data, pointer).length === 0) {
        return node.errors.notError({ value: data, not: schema.not, pointer, schema });
    }
}
