import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";

const KEYWORD = "format";

export const formatKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseFormat,
    addValidate: ({ schema }) => schema?.format != null,
    validate: validateFormat
};

function parseFormat(node: SchemaNode) {
    const format = node.schema[KEYWORD];
    if (format == null) {
        return;
    }
    if (typeof format !== "string") {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: format,
            message: `Keyword '${KEYWORD}' must be a string - received '${typeof format}'`
        });
    }
    if (node.context.formats[format] == null) {
        return node.createAnnotation("unknown-format-warning", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: format,
            message: `Keyword '${KEYWORD}' must be a string - received '${typeof format}'`
        });
    }
}

function validateFormat(options: JsonSchemaValidatorParams) {
    const { node } = options;
    const formatValidator = node.context.formats[node.schema.format];
    return formatValidator?.(options);
}
