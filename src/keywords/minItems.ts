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
        return node.createError("min-items-error", {
            minItems: schema.minItems,
            length: data.length,
            pointer,
            schema,
            value: data
        });
    }
}
