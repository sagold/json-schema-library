import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { isNumber, SchemaNode } from "../types";

const KEYWORD = "maximum";

export const maximumKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseMaximum,
    addValidate: (node) => node.maximum != null,
    validate: validateMaximum
};

function parseMaximum(node: SchemaNode) {
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

function validateMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!isNumber(data)) {
        return undefined;
    }

    const max = node[KEYWORD];
    const { schema } = node;
    if (max && max < data) {
        return node.createError("maximum-error", {
            maximum: max,
            length: data,
            value: data,
            pointer,
            schema
        });
    }
    if (max && schema.exclusiveMaximum === true && max === data) {
        return node.createError("maximum-error", {
            maximum: max,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    return undefined;
}
