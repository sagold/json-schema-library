import ucs2decode from "../utils/punycode.ucs2decode";
export const maxLengthFeature = {
    id: "maxLength",
    keyword: "maxLength",
    addValidate: ({ schema }) => !isNaN(schema.maxLength),
    validate: validateMaxLength
};
function validateMaxLength({ node, data, pointer = "#" }) {
    if (typeof data !== "string") {
        return;
    }
    const { schema } = node;
    const length = ucs2decode(data).length;
    if (schema.maxLength < length) {
        return node.errors.maxLengthError({
            maxLength: schema.maxLength,
            length,
            pointer,
            schema,
            value: data
        });
    }
}
