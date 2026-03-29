import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "minProperties";

export const minPropertiesKeyword: Keyword<"minProperties"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMinItems,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMinProperties
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

function validateMinProperties({ node, data, pointer = "#" }: JsonSchemaValidatorParams<"minProperties">) {
    if (!isObject(data)) {
        return;
    }
    const propertyCount = Object.keys(data).length;
    if (node.schema.minProperties > propertyCount) {
        return node.createError("min-properties-error", {
            minProperties: node.schema.minProperties,
            length: propertyCount,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
