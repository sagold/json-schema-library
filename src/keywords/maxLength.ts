import ucs2decode from "../utils/punycode.ucs2decode";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "maxLength";

export const maxLengthKeyword: Keyword<"maxLength"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMaxLength,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMaxLength
};

function parseMaxLength(node: SchemaNode) {
    const max = node.schema[KEYWORD];
    if (max == null) {
        return;
    }
    if (!isNumber(max)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: max,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof max}'`
        });
    }
    node[KEYWORD] = max;
}

function validateMaxLength({ node, data, pointer = "#" }: JsonSchemaValidatorParams<"maxLength">) {
    if (typeof data !== "string") {
        return;
    }
    const maxLength = node[KEYWORD];
    const length = ucs2decode(data).length;
    if (maxLength < length) {
        return node.createError("max-length-error", {
            maxLength: maxLength,
            length,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
