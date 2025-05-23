export const maximumKeyword = {
    id: "maximum",
    keyword: "maximum",
    addValidate: ({ schema }) => !isNaN(schema.maximum),
    validate: validateMaximum
};
function validateMaximum({ node, data, pointer }) {
    if (isNaN(data)) {
        return undefined;
    }
    const { schema } = node;
    if (schema.maximum && schema.maximum < data) {
        return node.createError("maximum-error", {
            maximum: schema.maximum,
            length: data,
            value: data,
            pointer,
            schema
        });
    }
    if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === data) {
        return node.createError("maximum-error", {
            maximum: schema.maximum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    return undefined;
}
