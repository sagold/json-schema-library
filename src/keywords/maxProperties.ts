import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { isNumber } from "../types";

const KEYWORD = "maxProperties";

export const maxPropertiesKeyword: Keyword<typeof KEYWORD> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMaxProperties,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateMaxProperties
};

function parseMaxProperties(node: SchemaNode) {
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

function validateMaxProperties({ node, data, pointer = "#" }: JsonSchemaValidatorParams<typeof KEYWORD>) {
    if (!isObject(data)) {
        return;
    }
    const maxProperties = node[KEYWORD];
    const propertyCount = Object.keys(data).length;
    if (maxProperties < propertyCount) {
        return node.createError("max-properties-error", {
            maxProperties: maxProperties,
            length: propertyCount,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
