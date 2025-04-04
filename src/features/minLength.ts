import ucs2decode from "../utils/punycode.ucs2decode";
import { Feature, JsonSchemaValidatorParams } from "../Feature";

export const minLengthFeature: Feature = {
    id: "minLength",
    keyword: "minLength",
    addValidate: ({ schema }) => !isNaN(schema.minLength),
    validate: validateMinLength
};

function validateMinLength({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (typeof data !== "string") {
        return;
    }
    const { schema } = node;
    const length = ucs2decode(data).length;
    if (schema.minLength <= length) {
        return;
    }
    return node.errors.minLengthError({
        minLength: schema.minLength,
        length,
        pointer,
        schema,
        value: data
    });
}
