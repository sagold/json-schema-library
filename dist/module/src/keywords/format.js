export const formatKeyword = {
    id: "format",
    keyword: "format",
    addValidate: ({ schema }) => (schema === null || schema === void 0 ? void 0 : schema.format) != null,
    validate: validateFormat
};
function validateFormat(options) {
    const { node } = options;
    const formatValidator = node.context.formats[node.schema.format];
    return formatValidator === null || formatValidator === void 0 ? void 0 : formatValidator(options);
}
