import { Keyword, JsonSchemaValidatorParams } from "../Keyword.js";

export const exclusiveMaximumKeyword: Keyword = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum != null && !isNaN(parseInt(schema.exclusiveMaximum)),
    validate: validateExclusiveMaximum
};

function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum <= data) {
        return node.createError("exclusive-maximum-error", {
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
