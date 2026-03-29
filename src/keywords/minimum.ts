import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { isNumber, SchemaNode } from "../types";

const KEYWORD = "minimum";

export const minimumKeyword: Keyword<"minimum"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMinimum,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMinimum
};

function parseMinimum(node: SchemaNode) {
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

function validateMinimum({ node, data, pointer }: JsonSchemaValidatorParams<"minimum">) {
    if (!isNumber(data)) {
        return undefined;
    }
    const min = node[KEYWORD];
    if (min > data) {
        return node.createError("minimum-error", {
            minimum: min,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
    if (node.schema.exclusiveMinimum === true && node.schema.minimum === data) {
        return node.createError("minimum-error", {
            minimum: min,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
    return undefined;
}
