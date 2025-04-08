import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const maxItemsKeyword: Keyword = {
    id: "maxItems",
    keyword: "maxItems",
    addValidate: ({ schema }) => !isNaN(schema.maxItems),
    validate: validateMaxItems
};

function validateMaxItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (Array.isArray(data) && schema.maxItems < data.length) {
        return node.createError("max-items-error", {
            maximum: schema.maxItems,
            length: data.length,
            schema,
            value: data,
            pointer
        });
    }
}
