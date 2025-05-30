export const exclusiveMaximumKeyword = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum === true || !isNaN(schema.maximum),
    validate: validateExclusiveMaximum
};
function validateExclusiveMaximum({ node, data, pointer }) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum && node.schema.maximum === data) {
        return node.createError("maximum-error", {
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
