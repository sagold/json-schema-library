import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";

const KEYWORD = "exclusiveMinimum";

export const exclusiveMinimumKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseExclusiveMinimum,
    addValidate: ({ schema }) => schema[KEYWORD] != null && !isNaN(parseInt(schema[KEYWORD])),
    validate: validateExclusiveMinimum
};

function parseExclusiveMinimum(node: SchemaNode) {
    const min = node.schema[KEYWORD];
    if (min == null) {
        return;
    }
    if (typeof min !== "number") {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: min,
            message: `Keyword '${KEYWORD}' must be a number - received '${typeof min}'`
        });
    }
}

function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum >= data) {
        return node.createError("exclusive-minimum-error", {
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
