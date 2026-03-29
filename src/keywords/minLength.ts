import ucs2decode from "../utils/punycode.ucs2decode";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "minLength";

export const minLengthKeyword: Keyword<"minLength"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMinLength,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMinLength
};

function parseMinLength(node: SchemaNode) {
    const min = node.schema[KEYWORD];
    if (min == null) {
        return;
    }
    if (!isNumber(min)) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: min,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof min}'`
        });
    }
    node[KEYWORD] = min;
}

function validateMinLength({ node, data, pointer = "#" }: JsonSchemaValidatorParams<"minLength">) {
    if (typeof data !== "string") {
        return;
    }
    const length = ucs2decode(data).length;
    const minLength = node[KEYWORD];
    if (minLength <= length) {
        return;
    }
    return node.createError("min-length-error", {
        minLength,
        length,
        pointer,
        schema: node.schema,
        value: data
    });
}
