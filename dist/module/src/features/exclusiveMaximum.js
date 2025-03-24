export const exclusiveMaximumFeature = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum != null && !isNaN(parseInt(schema.exclusiveMaximum)),
    validate: validateExclusiveMaximum
};
function validateExclusiveMaximum({ node, data, pointer }) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum <= data) {
        return node.errors.exclusiveMaximumError({
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
