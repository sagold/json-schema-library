export const minItemsKeyword = {
    id: "minItems",
    keyword: "minItems",
    addValidate: ({ schema }) => !isNaN(schema.minItems),
    validate: validateMinItems
};
function validateMinItems({ node, data, pointer }) {
    if (!Array.isArray(data)) {
        return;
    }
    const { schema } = node;
    if (schema.minItems > data.length) {
        if (schema.minItems === 1) {
            return node.createError("MinItemsOneError", {
                minItems: schema.minItems,
                length: data.length,
                pointer,
                schema,
                value: data
            });
        }
        return node.createError("MinItemsError", {
            minItems: schema.minItems,
            length: data.length,
            pointer,
            schema,
            value: data
        });
    }
}
