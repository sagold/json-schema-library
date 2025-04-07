import ucs2decode from "../utils/punycode.ucs2decode";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const maxLengthKeyword: Keyword = {
    id: "maxLength",
    keyword: "maxLength",
    addValidate: ({ schema }) => !isNaN(schema.maxLength),
    validate: validateMaxLength
};

function validateMaxLength({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (typeof data !== "string") {
        return;
    }
    const { schema } = node;
    const length = ucs2decode(data).length;
    if (schema.maxLength < length) {
        return node.createError("MaxLengthError", {
            maxLength: schema.maxLength,
            length,
            pointer,
            schema,
            value: data
        });
    }
}
