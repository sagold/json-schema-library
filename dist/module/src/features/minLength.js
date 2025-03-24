import ucs2decode from "../utils/punycode.ucs2decode";
export const minLengthFeature = {
    id: "minLength",
    keyword: "minLength",
    addValidate: ({ schema }) => !isNaN(schema.minLength),
    validate: validateMinLength
};
function validateMinLength({ node, data, pointer = "#" }) {
    if (typeof data !== "string") {
        return;
    }
    const { schema } = node;
    const length = ucs2decode(data).length;
    if (schema.minLength <= length) {
        return;
    }
    if (schema.minLength === 1) {
        return node.errors.minLengthOneError({
            minLength: schema.minLength,
            length,
            pointer,
            schema,
            value: data
        });
    }
    return node.errors.minLengthError({
        minLength: schema.minLength,
        length,
        pointer,
        schema,
        value: data
    });
}
