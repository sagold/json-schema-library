import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import type { Context, SchemaNode } from "../SchemaNode";

const KEYWORD = "format";

export const formatKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseFormat,
    addValidate: ({ schema }) => schema?.format != null,
    validate: validateFormat
};

export function applyFormatAssertion(context: Context) {
    if (context.formatAssertion === false) {
        context.keywords = context.keywords.map((keyword) =>
            keyword.keyword === KEYWORD ? { ...keyword, addValidate: () => false } : keyword
        );
    }
}

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
