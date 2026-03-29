import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";

const KEYWORD = "exclusiveMaximum";

export const exclusiveMaximumKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseExclusiveMaximum,
    addValidate: ({ schema }) => schema.exclusiveMaximum != null && !isNaN(parseInt(schema.exclusiveMaximum)),
    validate: validateExclusiveMaximum
};

function parseExclusiveMaximum(node: SchemaNode) {
    const max = node.schema[KEYWORD];
    if (max == null) {
        return;
    }
    if (typeof max !== "number") {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: max,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof max}'`
        });
    }
}

function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum <= data) {
        return node.createError("exclusive-maximum-error", {
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
