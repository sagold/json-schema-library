import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const formatKeyword: Keyword = {
    id: "format",
    keyword: "format",
    addValidate: ({ schema }) => schema?.format != null,
    validate: validateFormat
};

function validateFormat(options: JsonSchemaValidatorParams) {
    const { node } = options;
    const formatValidator = node.context.formats[node.schema.format];
    return formatValidator?.(options);
}
