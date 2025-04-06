import { JsonSchemaValidatorParams, Keyword } from "../Keyword";

export const minItemsKeyword: Keyword = {
    id: "minItems",
    keyword: "minItems",
    addValidate: ({ schema }) => !isNaN(schema.minItems),
    validate: validateMinItems
};

function validateMinItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!Array.isArray(data)) {
        return;
    }
    const { schema } = node;
    if (schema.minItems > data.length) {
        if (schema.minItems === 1) {
            return node.errors.minItemsOneError({
                minItems: schema.minItems,
                length: data.length,
                pointer,
                schema,
                value: data
            });
        }
        return node.errors.minItemsError({
            minItems: schema.minItems,
            length: data.length,
            pointer,
            schema,
            value: data
        });
    }
}
