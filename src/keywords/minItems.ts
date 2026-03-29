import { JsonSchemaValidatorParams, Keyword } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "minItems";

export const minItemsKeyword: Keyword<"minItems"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMinItems,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMinItems
};

function parseMinItems(node: SchemaNode) {
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

function validateMinItems({ node, data, pointer }: JsonSchemaValidatorParams<"minItems">) {
    if (!Array.isArray(data)) {
        return;
    }
    const minItems = node[KEYWORD];
    if (minItems > data.length) {
        return node.createError("min-items-error", {
            minItems: minItems,
            length: data.length,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
